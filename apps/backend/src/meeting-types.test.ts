import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { expect, test } from 'vitest'
import { createApplication } from './app.ts'

test('GET /api/meeting-types returns an empty list when no types exist', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'meeting-types-'))
  const { app, close } = await createApplication({ dataDir })

  try {
    const response = await request(app).get('/api/meeting-types')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  } finally {
    await close()
    await rm(dataDir, { recursive: true, force: true })
  }
})

test('meeting types survive an application restart', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'meeting-types-'))
  const first = await createApplication({ dataDir })
  let created: unknown

  try {
    const response = await request(first.app).post('/api/meeting-types').send({
      name: 'Разбор проекта',
      description: 'Разбираем текущее состояние проекта',
      duration: 60,
    })
    created = response.body
  } finally {
    await first.close()
  }

  const second = await createApplication({ dataDir })

  try {
    const response = await request(second.app).get('/api/meeting-types')
    expect(response.status).toBe(200)
    expect(response.body).toEqual([created])
  } finally {
    await second.close()
    await rm(dataDir, { recursive: true, force: true })
  }
})

test('invalid fields return field errors and create nothing', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'meeting-types-'))
  const { app, close } = await createApplication({ dataDir })
  const valid = {
    name: 'Консультация',
    description: 'Обсуждаем задачу',
    duration: 30,
  }
  const invalidValues = [
    { field: 'name', value: undefined },
    { field: 'description', value: undefined },
    { field: 'duration', value: undefined },
    { field: 'name', value: '   ' },
    { field: 'name', value: 'x'.repeat(101) },
    { field: 'description', value: '   ' },
    { field: 'description', value: 'x'.repeat(1001) },
    { field: 'duration', value: 0 },
    { field: 'duration', value: 20 },
    { field: 'duration', value: 121 },
    { field: 'duration', value: 15.5 },
  ]

  try {
    for (const { field, value } of invalidValues) {
      const response = await request(app).post('/api/meeting-types').send({
        ...valid,
        [field]: value,
      })

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ field }),
      ]))
    }

    const list = await request(app).get('/api/meeting-types')
    expect(list.body).toEqual([])
  } finally {
    await close()
    await rm(dataDir, { recursive: true, force: true })
  }
})

test('duplicate names receive different ids and append in creation order', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'meeting-types-'))
  const { app, close } = await createApplication({ dataDir })
  const input = {
    name: 'Одинаковое название',
    description: 'Описание',
    duration: 30,
  }

  try {
    const first = await request(app).post('/api/meeting-types').send(input)
    const second = await request(app).post('/api/meeting-types').send({
      ...input,
      duration: 45,
    })

    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
    expect(first.body.id).toMatch(/^[a-z0-9]{3}-[a-z0-9]{5}$/)
    expect(second.body.id).toMatch(/^[a-z0-9]{3}-[a-z0-9]{5}$/)
    expect(second.body.id).not.toBe(first.body.id)
    expect((await request(app).get('/api/meeting-types')).body).toEqual([
      first.body,
      second.body,
    ])
  } finally {
    await close()
    await rm(dataDir, { recursive: true, force: true })
  }
})

test('trimmed boundary-length fields and inclusive duration limits are accepted', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'meeting-types-'))
  const { app, close } = await createApplication({ dataDir })

  try {
    for (const duration of [15, 120]) {
      const response = await request(app).post('/api/meeting-types').send({
        name: `  ${'н'.repeat(100)}  `,
        description: `  ${'о'.repeat(1000)}  `,
        duration,
      })

      expect(response.status).toBe(201)
      expect(response.body.name).toBe('н'.repeat(100))
      expect(response.body.description).toBe('о'.repeat(1000))
      expect(response.body.duration).toBe(duration)
    }
  } finally {
    await close()
    await rm(dataDir, { recursive: true, force: true })
  }
})

test('POST /api/meeting-types rejects an owner-supplied id', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'meeting-types-'))
  const { app, close } = await createApplication({ dataDir })

  try {
    const response = await request(app).post('/api/meeting-types').send({
      id: 'chosen-id',
      name: 'Консультация',
      description: 'Обсуждаем задачу',
      duration: 30,
    })

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'id' }),
    ]))
    expect((await request(app).get('/api/meeting-types')).body).toEqual([])
  } finally {
    await close()
    await rm(dataDir, { recursive: true, force: true })
  }
})

test('POST /api/meeting-types creates a trimmed Russian type with an automatic id', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'meeting-types-'))
  const { app, close } = await createApplication({ dataDir })

  try {
    const response = await request(app).post('/api/meeting-types').send({
      name: '  Консультация  ',
      description: '  Обсуждаем задачу  ',
      duration: 45,
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      id: expect.stringMatching(/^[a-z0-9]{3}-[a-z0-9]{5}$/),
      name: 'Консультация',
      description: 'Обсуждаем задачу',
      duration: 45,
    })

    const list = await request(app).get('/api/meeting-types')
    expect(list.body).toEqual([response.body])
  } finally {
    await close()
    await rm(dataDir, { recursive: true, force: true })
  }
})

test('GET /api/meeting-types/:id returns a saved type and reports an unknown id', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'meeting-types-'))
  const { app, close } = await createApplication({ dataDir })

  try {
    const created = await request(app).post('/api/meeting-types').send({
      name: 'Знакомство',
      description: 'Обсуждаем цели и контекст',
      duration: 15,
    })
    const found = await request(app).get(`/api/meeting-types/${created.body.id}`)
    const missing = await request(app).get('/api/meeting-types/aaa-aaaaa')

    expect(found.status).toBe(200)
    expect(found.body).toEqual(created.body)
    expect(missing.status).toBe(404)
  } finally {
    await close()
    await rm(dataDir, { recursive: true, force: true })
  }
})
