import path from 'node:path'
import { createApplication } from './app.ts'

const port = Number(process.env.PORT ?? 3000)
const { app } = await createApplication({
  dataDir: process.env.DATA_DIR ?? path.resolve('data'),
  staticDir: process.env.STATIC_DIR,
})

app.listen(port, '0.0.0.0')
