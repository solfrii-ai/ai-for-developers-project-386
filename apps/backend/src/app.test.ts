import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { expect, test } from 'vitest'
import { app, serveStatic } from './app.ts'

test('GET /api/health returns HTTP 200 and status ok', async () => {
  const response = await request(app).get('/api/health')

  expect(response.status).toBe(200)
  expect(response.body).toEqual({ status: 'ok' })
})

test('GET / serves the frontend when static files are attached', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'frontend-'))
  await writeFile(path.join(directory, 'index.html'), '<!doctype html><title>ok</title>')
  serveStatic(directory)

  const response = await request(app).get('/')

  expect(response.status).toBe(200)
  expect(response.text).toContain('<title>ok</title>')
  expect(response.headers['content-type']).toContain('text/html')
})
