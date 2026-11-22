import { rm } from 'node:fs/promises'

export default async function teardown() {
  const dataDirs = process.env.E2E_DATA_DIRS?.split(':').filter(Boolean) ?? []
  await Promise.all(dataDirs.map((dataDir) => rm(dataDir, { recursive: true, force: true })))
}
