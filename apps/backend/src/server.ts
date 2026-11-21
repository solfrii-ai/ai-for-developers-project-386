import { app, serveStatic } from './app.ts'

const port = Number(process.env.PORT ?? 3000)

if (process.env.STATIC_DIR) {
  serveStatic(process.env.STATIC_DIR)
}

app.listen(port, '0.0.0.0')
