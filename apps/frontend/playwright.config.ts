import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'

const directory = path.dirname(fileURLToPath(import.meta.url))
const dataDir = mkdtempSync(path.join(tmpdir(), 'calendar-calls-e2e-'))
process.env.E2E_DATA_DIR = dataDir

export default defineConfig({
  testDir: './e2e',
  globalTeardown: './e2e/teardown.ts',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
  },
  webServer: [
    {
      command: 'pnpm dev',
      cwd: path.resolve(directory, '../backend'),
      url: 'http://127.0.0.1:3000/api/health',
      env: { DATA_DIR: dataDir },
      reuseExistingServer: false,
    },
    {
      command: 'pnpm dev --host 127.0.0.1',
      cwd: directory,
      url: 'http://127.0.0.1:5173/admin',
      reuseExistingServer: false,
    },
  ],
})
