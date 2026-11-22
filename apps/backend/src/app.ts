import { randomInt } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { asc, eq, gte } from 'drizzle-orm'
import express, { type ErrorRequestHandler } from 'express'
import * as OpenApiValidator from 'express-openapi-validator'
import { availabilityFor } from './availability.ts'
import { createDatabase } from './db/client.ts'
import { meetingTypes, meetings } from './db/schema.ts'

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

const conflictMessage = 'Встреча не создана: выбранный слот уже занят. Выберите другой свободный слот.'

function isGuestEmail(value: string) {
  if (/\s/u.test(value)) {
    return false
  }
  const parts = value.split('@')
  if (parts.length !== 2) {
    return false
  }
  const [local, domain] = parts
  if (!local || !domain) {
    return false
  }
  const labels = domain.split('.')
  return labels.length >= 2 && labels.every((label) => label.length > 0)
}

function isExclusionViolation(error: unknown) {
  const queue = [error]
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || typeof current !== 'object') {
      continue
    }
    if ('code' in current && current.code === '23P01') {
      return true
    }
    if ('cause' in current) {
      queue.push(current.cause)
    }
  }
  return false
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
  now = () => new Date(),
}: {
  dataDir: string
  staticDir?: string
  now?: () => Date
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
  const openApi = OpenApiValidator.middleware({
    apiSpec: fileURLToPath(new URL('../generated/openapi.json', import.meta.url)),
    validateRequests: true,
    validateResponses: true,
  })
  application.use('/api/meeting-types', openApi)
  application.use('/api/upcoming', openApi)
  application.use('/api/bookings', (request: express.Request, _response: express.Response, next: express.NextFunction) => {
    if (request.method === 'POST' && request.body) {
      request.body = {
        ...request.body,
        guestName: typeof request.body.guestName === 'string' ? request.body.guestName.trim() : request.body.guestName,
        guestEmail: typeof request.body.guestEmail === 'string' ? request.body.guestEmail.trim() : request.body.guestEmail,
      }
    }
    next()
  }, openApi)

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

  application.get('/api/meeting-types/:id/availability', async (request, response) => {
    const [type] = await db.select({
      duration: meetingTypes.duration,
    }).from(meetingTypes).where(eq(meetingTypes.id, request.params.id)).limit(1)

    if (!type) {
      response.status(404).json({ message: 'Тип встречи не найден' })
      return
    }

    const occupied = await db.select({
      startAt: meetings.startAt,
      endAt: meetings.endAt,
    }).from(meetings)
    response.status(200).json(availabilityFor(type.duration, now(), occupied.map((interval) => ({
      start: interval.startAt.toISOString(),
      end: interval.endAt.toISOString(),
    }))))
  })

  application.get('/api/upcoming', async (_request, response) => {
    const rows = await db.select({
      meetingTypeName: meetingTypes.name,
      startAt: meetings.startAt,
      endAt: meetings.endAt,
      guestName: meetings.guestName,
      guestEmail: meetings.guestEmail,
      createdAt: meetings.createdAt,
    }).from(meetings)
      .innerJoin(meetingTypes, eq(meetings.meetingTypeId, meetingTypes.id))
      .where(gte(meetings.startAt, now()))
      .orderBy(asc(meetings.startAt))

    response.status(200).json(rows.map((row) => ({
      meetingTypeName: row.meetingTypeName,
      start: row.startAt.toISOString(),
      end: row.endAt.toISOString(),
      guestName: row.guestName,
      guestEmail: row.guestEmail,
      createdAt: row.createdAt.toISOString(),
    })))
  })

  application.post('/api/bookings', async (request, response) => {
    const guestName = typeof request.body.guestName === 'string' ? request.body.guestName.trim() : ''
    const guestEmail = typeof request.body.guestEmail === 'string' ? request.body.guestEmail.trim() : ''
    const errors: { field: string, message: string }[] = []

    if (!guestName) {
      errors.push({ field: 'guestName', message: 'Введите имя' })
    } else if (guestName.length > 100) {
      errors.push({ field: 'guestName', message: 'Имя должно содержать не более 100 символов' })
    }
    if (!guestEmail) {
      errors.push({ field: 'guestEmail', message: 'Введите почту' })
    } else if (guestEmail.length > 254) {
      errors.push({ field: 'guestEmail', message: 'Почта должна содержать не более 254 символов' })
    } else if (!isGuestEmail(guestEmail)) {
      errors.push({ field: 'guestEmail', message: 'Введите почту в виде имя@домен.зона' })
    }
    if (errors.length > 0) {
      response.status(400).json({ message: 'Проверьте поля формы', errors })
      return
    }

    const [type] = await db.select({
      id: meetingTypes.id,
      name: meetingTypes.name,
      duration: meetingTypes.duration,
    }).from(meetingTypes).where(eq(meetingTypes.id, request.body.meetingTypeId)).limit(1)
    if (!type) {
      response.status(404).json({ message: 'Тип встречи не найден' })
      return
    }

    const offered = availabilityFor(type.duration, now()).slots.find((slot) => slot.start === new Date(request.body.start).toISOString())
    if (!offered) {
      response.status(400).json({
        message: 'Проверьте поля формы',
        errors: [{ field: 'start', message: 'Выберите свободный слот' }],
      })
      return
    }

    const createdAt = now()
    try {
      await db.insert(meetings).values({
        meetingTypeId: type.id,
        startAt: new Date(offered.start),
        endAt: new Date(offered.end),
        guestName,
        guestEmail,
        createdAt,
      })
    } catch (error) {
      if (isExclusionViolation(error)) {
        response.status(409).json({ message: conflictMessage })
        return
      }
      throw error
    }

    response.status(201).json({
      meetingTypeId: type.id,
      meetingTypeName: type.name,
      start: offered.start,
      end: offered.end,
      guestName,
      guestEmail,
      createdAt: createdAt.toISOString(),
    })
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
