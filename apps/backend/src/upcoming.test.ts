import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { expect, test } from 'vitest'
import { createApplication } from './app.ts'

test('upcoming lists public future meetings in start order and hides one that already started', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'upcoming-'))
  const early = await createApplication({ dataDir, now: () => new Date('2026-03-02T08:00:00.000Z') })

  try {
    const empty = await request(early.app).get('/api/upcoming')
    expect(empty.status).toBe(200)
    expect(empty.body).toEqual([])

    const type = await request(early.app).post('/api/meeting-types').send({
      name: 'Консультация',
      description: 'Обсуждаем задачу',
      duration: 30,
    })
    await request(early.app).post('/api/bookings').send({
      meetingTypeId: type.body.id,
      start: '2026-03-03T09:00:00.000Z',
      guestName: 'Позже',
      guestEmail: 'later@example.com',
    })
    await request(early.app).post('/api/bookings').send({
      meetingTypeId: type.body.id,
      start: '2026-03-02T09:00:00.000Z',
      guestName: 'Рано',
      guestEmail: 'early@example.com',
    })
    await request(early.app).post('/api/bookings').send({
      meetingTypeId: type.body.id,
      start: '2026-03-02T11:00:00.000Z',
      guestName: 'Дальше',
      guestEmail: 'next@example.com',
    })

    const listed = await request(early.app).get('/api/upcoming')
    expect(listed.status).toBe(200)
    expect(listed.body.map((meeting: { start: string }) => meeting.start)).toEqual([
      '2026-03-02T09:00:00.000Z',
      '2026-03-02T11:00:00.000Z',
      '2026-03-03T09:00:00.000Z',
    ])
    expect(listed.body[0]).toEqual({
      meetingTypeName: 'Консультация',
      start: '2026-03-02T09:00:00.000Z',
      end: '2026-03-02T09:30:00.000Z',
      guestName: 'Рано',
      guestEmail: 'early@example.com',
      createdAt: '2026-03-02T08:00:00.000Z',
    })
  } finally {
    await early.close()
  }

  const later = await createApplication({ dataDir, now: () => new Date('2026-03-02T10:30:00.000Z') })

  try {
    const listed = await request(later.app).get('/api/upcoming')
    expect(listed.body.map((meeting: { start: string }) => meeting.start)).toEqual([
      '2026-03-02T11:00:00.000Z',
      '2026-03-03T09:00:00.000Z',
    ])
    expect(listed.body.some((meeting: { guestEmail: string }) => meeting.guestEmail === 'early@example.com')).toBe(false)
  } finally {
    await later.close()
    await rm(dataDir, { recursive: true, force: true })
  }
})
