import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { expect, test } from 'vitest'
import { createApplication } from './app.ts'

const now = new Date('2026-03-02T08:00:00.000Z')
const conflictMessage = 'Встреча не создана: выбранный слот уже занят. Выберите другой свободный слот.'

async function withApp(run: (app: Awaited<ReturnType<typeof createApplication>>['app']) => Promise<void>) {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'bookings-'))
  const application = await createApplication({ dataDir, now: () => now })

  try {
    await run(application.app)
  } finally {
    await application.close()
    await rm(dataDir, { recursive: true, force: true })
  }
}

async function createType(app: Parameters<typeof request>[0], duration: number, name = 'Консультация') {
  const response = await request(app).post('/api/meeting-types').send({
    name,
    description: 'Обсуждаем задачу',
    duration,
  })
  expect(response.status).toBe(201)
  return response.body as { id: string, name: string, duration: number }
}

test('booking validates guest fields and creates nothing', async () => {
  await withApp(async (app) => {
    const type = await createType(app, 60)
    const invalid = [
      { guestName: '   ', guestEmail: 'guest@example.com', field: 'guestName' },
      { guestName: 'Гость', guestEmail: '   ', field: 'guestEmail' },
      { guestName: 'я'.repeat(101), guestEmail: 'guest@example.com', field: 'guestName' },
      { guestName: 'Гость', guestEmail: `${'a'.repeat(251)}@b.c`, field: 'guestEmail' },
      { guestName: 'Гость', guestEmail: 'guest@example', field: 'guestEmail' },
      { guestName: 'Гость', guestEmail: 'guest@example.', field: 'guestEmail' },
      { guestName: 'Гость', guestEmail: 'guest@@example.com', field: 'guestEmail' },
      { guestName: 'Гость', guestEmail: 'gu est@example.com', field: 'guestEmail' },
    ]

    for (const { field, ...body } of invalid) {
      const response = await request(app).post('/api/bookings').send({
        meetingTypeId: type.id,
        start: '2026-03-02T10:00:00.000Z',
        ...body,
      })
      expect(response.status).toBe(400)
      expect(response.body.errors.map((error: { field: string }) => error.field)).toContain(field)
    }

    const availability = await request(app).get(`/api/meeting-types/${type.id}/availability`)
    expect(availability.body.slots.some((slot: { start: string }) => slot.start === '2026-03-02T10:00:00.000Z')).toBe(true)
  })
})

test('booking creates a meeting, hides the occupied interval, and allows the same email on a free slot', async () => {
  await withApp(async (app) => {
    const hour = await createType(app, 60, 'Час')
    const half = await createType(app, 30, 'Полчаса')
    const created = await request(app).post('/api/bookings').send({
      meetingTypeId: hour.id,
      start: '2026-03-02T10:00:00.000Z',
      guestName: '  Гость  ',
      guestEmail: '  guest@example.com  ',
    })

    expect(created.status).toBe(201)
    expect(created.body).toEqual({
      meetingTypeId: hour.id,
      meetingTypeName: 'Час',
      start: '2026-03-02T10:00:00.000Z',
      end: '2026-03-02T11:00:00.000Z',
      guestName: 'Гость',
      guestEmail: 'guest@example.com',
      createdAt: now.toISOString(),
    })

    const hourSlots = await request(app).get(`/api/meeting-types/${hour.id}/availability`)
    const halfSlots = await request(app).get(`/api/meeting-types/${half.id}/availability`)
    const halfStarts = halfSlots.body.slots
      .filter((slot: { start: string }) => slot.start.startsWith('2026-03-02'))
      .map((slot: { start: string }) => slot.start)

    expect(hourSlots.body.slots.some((slot: { start: string }) => slot.start === '2026-03-02T10:00:00.000Z')).toBe(false)
    expect(halfStarts).not.toContain('2026-03-02T10:00:00.000Z')
    expect(halfStarts).not.toContain('2026-03-02T10:30:00.000Z')
    expect(halfStarts).toContain('2026-03-02T11:00:00.000Z')

    const overlapping = await request(app).post('/api/bookings').send({
      meetingTypeId: half.id,
      start: '2026-03-02T10:30:00.000Z',
      guestName: 'Другой',
      guestEmail: 'other@example.com',
    })
    const adjacent = await request(app).post('/api/bookings').send({
      meetingTypeId: half.id,
      start: '2026-03-02T11:00:00.000Z',
      guestName: 'Гость',
      guestEmail: 'guest@example.com',
    })

    expect(overlapping.status).toBe(409)
    expect(overlapping.body).toEqual({ message: conflictMessage })
    expect(adjacent.status).toBe(201)
    expect(adjacent.body.guestEmail).toBe('guest@example.com')
    expect(adjacent.body.start).toBe('2026-03-02T11:00:00.000Z')
  })
})

test('two concurrent bookings of one interval create exactly one meeting', async () => {
  await withApp(async (app) => {
    const type = await createType(app, 30)
    const payload = {
      meetingTypeId: type.id,
      start: '2026-03-02T09:00:00.000Z',
      guestName: 'Гость',
      guestEmail: 'guest@example.com',
    }
    const [first, second] = await Promise.all([
      request(app).post('/api/bookings').send(payload),
      request(app).post('/api/bookings').send(payload),
    ])
    const statuses = [first.status, second.status].sort()

    expect(statuses).toEqual([201, 409])
    expect([first.body.message, second.body.message].filter(Boolean)).toEqual([conflictMessage])

    const availability = await request(app).get(`/api/meeting-types/${type.id}/availability`)
    expect(availability.body.slots.some((slot: { start: string }) => slot.start === '2026-03-02T09:00:00.000Z')).toBe(false)
    expect(availability.body.days[0].freeCount).toBe(17)
  })
})
