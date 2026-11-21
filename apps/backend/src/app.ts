import express from 'express'

export const app = express()

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' })
})

export function serveStatic(directory: string) {
  app.use(express.static(directory))
}
