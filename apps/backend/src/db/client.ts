import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from './schema.ts'

export async function createDatabase(dataDir: string) {
  const client = new PGlite(dataDir)
  await client.waitReady
  const db = drizzle(client, { schema })
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)),
  })

  return {
    db,
    close: () => client.close(),
  }
}
