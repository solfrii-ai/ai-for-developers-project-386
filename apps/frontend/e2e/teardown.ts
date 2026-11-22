import { rm } from 'node:fs/promises'

export default async function teardown() {
  if (process.env.E2E_DATA_DIR) {
    await rm(process.env.E2E_DATA_DIR, { recursive: true, force: true })
  }
}
