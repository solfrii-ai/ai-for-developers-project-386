import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { expect, test } from 'vitest'
import { createApplication } from './app.ts'

const mondayMorning = new Date('2026-03-02T08:00:00.000Z')

async function createType(app: Parameters<typeof request>[0], duration: number) {
  const response = await request(app).post('/api/meeting-types').send({
    name: 'Консультация',
    description: 'Обсуждаем задачу',
    duration,
  })
  expect(response.status).toBe(201)
  return response.body as { id: string, duration: number }
}

test('availability uses the 14 UTC dates, weekdays, hours, and duration step', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'availability-'))
  const { app, close } = await createApplication({ dataDir, now: () => mondayMorning })

  try {
    const thirty = await createType(app, 30)
    const response = await request(app).get(`/api/meeting-types/${thirty.id}/availability`)
    const starts = response.body.slots
      .filter((slot: { start: string }) => slot.start.startsWith('2026-03-02'))
      .map((slot: { start: string }) => slot.start)

    expect(response.status).toBe(200)
    expect(response.body.days).toHaveLength(14)
    expect(response.body.days[0]).toEqual({ date: '2026-03-02', freeCount: 18 })
    expect(response.body.days[13]).toEqual({ date: '2026-03-15', freeCount: 0 })
    expect(response.body.days.map((day: { date: string }) => day.date)).not.toContain('2026-03-16')
    expect(response.body.days.find((day: { date: string }) => day.date === '2026-03-07')).toEqual({ date: '2026-03-07', freeCount: 0 })
    expect(response.body.days.find((day: { date: string }) => day.date === '2026-03-04')?.freeCount).toBe(18)
    expect(starts).toContain('2026-03-02T09:00:00.000Z')
    expect(starts).toContain('2026-03-02T09:30:00.000Z')
    expect(starts).not.toContain('2026-03-02T09:15:00.000Z')
    expect(starts.at(-1)).toBe('2026-03-02T17:30:00.000Z')
    expect(response.body.slots).toContainEqual({
      start: '2026-03-02T17:30:00.000Z',
      end: '2026-03-02T18:00:00.000Z',
    })
    expect(response.body.slots.some((slot: { start: string, end: string }) => slot.end > '2026-03-02T18:00:00.000Z' && slot.start.startsWith('2026-03-02'))).toBe(false)
    expect(response.body.slots.some((slot: { start: string }) => slot.start.startsWith('2026-03-07'))).toBe(false)

    const fortyFive = await createType(app, 45)
    const longer = await request(app).get(`/api/meeting-types/${fortyFive.id}/availability`)
    const longerStarts = longer.body.slots
      .filter((slot: { start: string }) => slot.start.startsWith('2026-03-02'))
      .map((slot: { start: string }) => slot.start)

    expect(longer.status).toBe(200)
    expect(longerStarts).toContain('2026-03-02T09:00:00.000Z')
    expect(longerStarts).toContain('2026-03-02T09:45:00.000Z')
    expect(longerStarts).not.toContain('2026-03-02T09:15:00.000Z')
    expect(longerStarts.at(-1)).toBe('2026-03-02T17:15:00.000Z')
    expect(longer.body.slots).toContainEqual({
      start: '2026-03-02T17:15:00.000Z',
      end: '2026-03-02T18:00:00.000Z',
    })
  } finally {
    await close()
    await rm(dataDir, { recursive: true, force: true })
  }
})

test('availability hides a start that is already in the past and keeps an exact start', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'availability-'))
  const exact = await createApplication({ dataDir, now: () => new Date('2026-03-02T09:00:00.000Z') })

  try {
    const type = await createType(exact.app, 30)
    const included = await request(exact.app).get(`/api/meeting-types/${type.id}/availability`)
    expect(included.body.slots[0]).toEqual({
      start: '2026-03-02T09:00:00.000Z',
      end: '2026-03-02T09:30:00.000Z',
    })
  } finally {
    await exact.close()
  }

  const later = await createApplication({ dataDir, now: () => new Date('2026-03-02T09:00:01.000Z') })

  try {
    const type = await createType(later.app, 30)
    const excluded = await request(later.app).get(`/api/meeting-types/${type.id}/availability`)
    const starts = excluded.body.slots
      .filter((slot: { start: string }) => slot.start.startsWith('2026-03-02'))
      .map((slot: { start: string }) => slot.start)

    expect(starts).not.toContain('2026-03-02T09:00:00.000Z')
    expect(starts[0]).toBe('2026-03-02T09:30:00.000Z')
    expect(excluded.body.days[0].freeCount).toBe(17)
  } finally {
    await later.close()
    await rm(dataDir, { recursive: true, force: true })
  }
})

test('availability reports an unknown meeting type', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'availability-'))
  const { app, close } = await createApplication({ dataDir, now: () => mondayMorning })

  try {
    const response = await request(app).get('/api/meeting-types/aaa-aaaaa/availability')
    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: 'Тип встречи не найден' })
  } finally {
    await close()
    await rm(dataDir, { recursive: true, force: true })
  }
})
