import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { expect, test } from 'vitest'
import { createApplication } from './app.ts'

test('GET /api/health returns HTTP 200 and status ok', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'health-'))
  const { app, close } = await createApplication({ dataDir })

  try {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  } finally {
    await close()
    await rm(dataDir, { recursive: true, force: true })
  }
})

test('static serving supports the frontend root and direct admin navigation', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'static-data-'))
  const directory = await mkdtemp(path.join(tmpdir(), 'frontend-'))
  await writeFile(path.join(directory, 'index.html'), '<!doctype html><title>ok</title>')
  const { app, close } = await createApplication({ dataDir, staticDir: directory })

  try {
    const root = await request(app).get('/')
    const admin = await request(app).get('/admin')
    const missingApi = await request(app).get('/api/missing')

    expect(root.status).toBe(200)
    expect(root.text).toContain('<title>ok</title>')
    expect(root.headers['content-type']).toContain('text/html')
    expect(admin.status).toBe(200)
    expect(admin.text).toContain('<title>ok</title>')
    expect(missingApi.status).toBe(404)
  } finally {
    await close()
    await rm(dataDir, { recursive: true, force: true })
    await rm(directory, { recursive: true, force: true })
  }
})
