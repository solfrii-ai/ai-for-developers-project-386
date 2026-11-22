import { randomInt } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { asc, eq } from 'drizzle-orm'
import express, { type ErrorRequestHandler } from 'express'
import * as OpenApiValidator from 'express-openapi-validator'
import { createDatabase } from './db/client.ts'
import { meetingTypes } from './db/schema.ts'

type MeetingType = {
  id: string
  name: string
  description: string
  duration: number
}

type RequestValidationError = {
  status: number
  errors: { path?: string, message: string }[]
}

function generateId(types: MeetingType[]) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id: string

  do {
    const value = Array.from({ length: 8 }, () => alphabet[randomInt(alphabet.length)]).join('')
    id = `${value.slice(0, 3)}-${value.slice(3)}`
  } while (types.some((type) => type.id === id))

  return id
}

const handleValidationError: ErrorRequestHandler = (error, _request, response, next) => {
  const validationError = error as Partial<RequestValidationError>
  if (validationError.status !== 400 || !Array.isArray(validationError.errors)) {
    next(error)
    return
  }

  response.status(400).json({
    message: 'Проверьте поля формы',
    errors: validationError.errors.map(({ path, message }) => ({
      field: path?.split(/[./]/).at(-1) ?? 'body',
      message,
    })),
  })
}

export async function createApplication({
  dataDir,
  staticDir,
}: {
  dataDir: string
  staticDir?: string
}) {
  const { db, close } = await createDatabase(dataDir)
  const application = express()

  const listTypes = () => db.select({
    id: meetingTypes.id,
    name: meetingTypes.name,
    description: meetingTypes.description,
    duration: meetingTypes.duration,
  }).from(meetingTypes).orderBy(asc(meetingTypes.position))

  application.get('/api/health', (_request, response) => {
    response.status(200).json({ status: 'ok' })
  })

  application.use(express.json())
  application.use('/api/meeting-types', (request, _response, next) => {
    if (request.method === 'POST' && request.body) {
      request.body = {
        ...request.body,
        name: typeof request.body.name === 'string' ? request.body.name.trim() : request.body.name,
        description: typeof request.body.description === 'string' ? request.body.description.trim() : request.body.description,
      }
    }
    next()
  })
  application.use('/api/meeting-types', OpenApiValidator.middleware({
    apiSpec: fileURLToPath(new URL('../generated/openapi.json', import.meta.url)),
    validateRequests: true,
    validateResponses: true,
  }))

  application.get('/api/meeting-types', async (_request, response) => {
    response.status(200).json(await listTypes())
  })

  application.get('/api/meeting-types/:id', async (request, response) => {
    const [type] = await db.select({
      id: meetingTypes.id,
      name: meetingTypes.name,
      description: meetingTypes.description,
      duration: meetingTypes.duration,
    }).from(meetingTypes).where(eq(meetingTypes.id, request.params.id)).limit(1)

    if (!type) {
      response.status(404).json({ message: 'Тип встречи не найден' })
      return
    }

    response.status(200).json(type)
  })

  application.post('/api/meeting-types', async (request, response) => {
    const name = typeof request.body.name === 'string' ? request.body.name.trim() : ''
    const description = typeof request.body.description === 'string' ? request.body.description.trim() : ''
    const duration = request.body.duration as number
    const errors: { field: string, message: string }[] = []

    if ('id' in request.body) {
      errors.push({ field: 'id', message: 'Id создаётся автоматически' })
    }
    if (!name) {
      errors.push({ field: 'name', message: 'Введите название' })
    } else if (name.length > 100) {
      errors.push({ field: 'name', message: 'Название должно содержать не более 100 символов' })
    }
    if (!description) {
      errors.push({ field: 'description', message: 'Введите описание' })
    } else if (description.length > 1000) {
      errors.push({ field: 'description', message: 'Описание должно содержать не более 1000 символов' })
    }
    if (!Number.isInteger(duration) || duration < 15 || duration > 120 || duration % 15 !== 0) {
      errors.push({ field: 'duration', message: 'Длительность должна быть от 15 до 120 минут с шагом 15' })
    }
    if (errors.length > 0) {
      response.status(400).json({ message: 'Проверьте поля формы', errors })
      return
    }

    const type = {
      id: generateId(await listTypes()),
      name,
      description,
      duration,
    }
    await db.insert(meetingTypes).values(type)
    response.status(201).json(type)
  })

  application.use(handleValidationError)

  if (staticDir) {
    application.use(express.static(staticDir))
    application.get('/{*path}', (request, response, next) => {
      if (request.path.startsWith('/api/')) {
        next()
        return
      }
      response.sendFile('index.html', { root: staticDir })
    })
  }

  return { app: application, close }
}
