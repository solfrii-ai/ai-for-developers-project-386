import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Project } from '@playwright/test'

function webServer(config: {
  command: string
  cwd: string
  url: string
  env: Record<string, string>
}) {
  return { ...config, reuseExistingServer: false }
}

const directory = path.dirname(fileURLToPath(import.meta.url))
const suites = [
  { name: 'admin', file: 'admin.spec.ts', appPort: 5173, apiPort: 3000, readyPath: '/admin', now: '' },
  { name: 'book', file: 'book.spec.ts', appPort: 5174, apiPort: 3001, readyPath: '/book', now: '' },
  { name: 'availability', file: 'availability.spec.ts', appPort: 5175, apiPort: 3002, readyPath: '/book', now: '2026-03-02T08:00:00.000Z' },
]
const dataDirs = suites.map(() => mkdtempSync(path.join(tmpdir(), 'calendar-calls-e2e-')))
process.env.E2E_DATA_DIRS = dataDirs.join(':')

export default defineConfig({
  testDir: './e2e',
  globalTeardown: './e2e/teardown.ts',
  fullyParallel: false,
  workers: 1,
  projects: suites.map((suite, index): Project => ({
    name: suite.name,
    testMatch: suite.file,
    use: {
      baseURL: `http://127.0.0.1:${suite.appPort}`,
      browserName: 'chromium',
    },
    metadata: { dataDir: dataDirs[index] },
  })),
  webServer: suites.flatMap((suite, index) => {
    const dataDir = dataDirs[index]
    if (!dataDir) {
      throw new Error('Missing e2e data directory')
    }

    return [
      webServer({
        command: 'pnpm dev',
        cwd: path.resolve(directory, '../backend'),
        url: `http://127.0.0.1:${suite.apiPort}/api/health`,
        env: {
          DATA_DIR: dataDir,
          PORT: String(suite.apiPort),
          ...(suite.now ? { NOW: suite.now } : {}),
        },
      }),
      webServer({
        command: `pnpm dev --host 127.0.0.1 --port ${suite.appPort}`,
        cwd: directory,
        url: `http://127.0.0.1:${suite.appPort}${suite.readyPath}`,
        env: { API_ORIGIN: `http://127.0.0.1:${suite.apiPort}` },
      }),
    ]
  }),
})
