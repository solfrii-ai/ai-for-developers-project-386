import request from 'supertest'
import { expect, test } from 'vitest'
import { app } from './app.ts'

test('GET /api/health returns HTTP 200 and status ok', async () => {
  const response = await request(app).get('/api/health')

  expect(response.status).toBe(200)
  expect(response.body).toEqual({ status: 'ok' })
})
