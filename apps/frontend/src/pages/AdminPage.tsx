import { useEffect, useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { components } from '@/api/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type MeetingType = components['schemas']['MeetingType']
type Field = 'name' | 'description' | 'duration'
type FieldErrors = Partial<Record<Field, string>>
type Draft = Record<Field, string>

const emptyDraft: Draft = { name: '', description: '', duration: '' }
const durations = [15, 30, 45, 60, 75, 90, 105, 120] as const

function validate(draft: Draft) {
  const errors: FieldErrors = {}
  const name = draft.name.trim()
  const description = draft.description.trim()

  if (!name) {
    errors.name = 'Введите название'
  } else if (name.length > 100) {
    errors.name = 'Название должно содержать не более 100 символов'
  }
  if (!description) {
    errors.description = 'Введите описание'
  } else if (description.length > 1000) {
    errors.description = 'Описание должно содержать не более 1000 символов'
  }
  if (!durations.some((value) => value === Number(draft.duration))) {
    errors.duration = 'Длительность должна быть от 15 до 120 минут с шагом 15'
  }

  return errors
}

function isField(value: string): value is Field {
  return value === 'name' || value === 'description' || value === 'duration'
}

export default function AdminPage() {
  const [types, setTypes] = useState<MeetingType[]>([])
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    void apiClient.GET('/api/meeting-types', { signal: controller.signal })
      .then(({ data, error }) => {
        if (controller.signal.aborted) {
          return
        }
        if (error || !data) {
          setLoadError('Не удалось загрузить типы встреч')
          return
        }
        setTypes(data)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadError('Не удалось загрузить типы встреч')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  const updateField = (field: Field, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const createType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationErrors = validate(draft)
    const duration = durations.find((value) => value === Number(draft.duration))

    setErrors(validationErrors)
    setNotice('')
    setFormError('')
    if (Object.keys(validationErrors).length > 0 || duration === undefined) {
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await apiClient.POST('/api/meeting-types', {
        body: {
          name: draft.name,
          description: draft.description,
          duration,
        },
      })

      if (error) {
        const nextErrors: FieldErrors = {}
        for (const item of error.errors) {
          if (isField(item.field)) {
            nextErrors[item.field] = item.message
          }
        }
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length === 0) {
          setFormError(error.message)
        }
        return
      }
      if (!data) {
        setFormError('Не удалось создать тип встречи')
        return
      }

      setTypes((current) => [...current, data])
      setDraft(emptyDraft)
      setNotice(`Тип встречи создан. Автоматический id: ${data.id}`)
    } catch {
      setFormError('Не удалось создать тип встречи')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 font-semibold text-slate-950">
          Календарь звонков
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">Страница владельца</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Типы встреч</h1>
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section aria-labelledby="existing-types">
            <h2 id="existing-types" className="mb-4 text-lg font-medium text-slate-900">Существующие типы</h2>
            {loading ? (
              <p className="text-sm text-slate-600">Загрузка типов встреч…</p>
            ) : loadError ? (
              <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{loadError}</p>
            ) : types.length === 0 ? (
              <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">Типов встреч пока нет. Создайте первый с помощью формы</p>
            ) : (
              <div className="space-y-3">
                {types.map((type) => (
                  <article key={type.id} className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-slate-950">{type.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{type.description}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{type.duration} мин</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <form
            aria-labelledby="new-meeting-type"
            noValidate
            onSubmit={createType}
            className="rounded-xl border border-slate-200 bg-white p-6 lg:sticky lg:top-6"
          >
            <h2 id="new-meeting-type" className="text-lg font-medium text-slate-950">Новый тип встречи</h2>
            <p className="mb-5 mt-1 text-sm text-slate-500">Id будет создан автоматически</p>
            <Label htmlFor="meeting-type-name">Название</Label>
            <Input
              id="meeting-type-name"
              className="mt-1"
              value={draft.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Например, Консультация"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && <p id="name-error" role="alert" className="mt-1 text-sm text-red-700">{errors.name}</p>}
            <Label htmlFor="meeting-type-description" className="mt-4">Описание</Label>
            <Textarea
              id="meeting-type-description"
              className="mt-1 min-h-24"
              value={draft.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="Что гость получит от встречи"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && <p id="description-error" role="alert" className="mt-1 text-sm text-red-700">{errors.description}</p>}
            <Label htmlFor="meeting-type-duration" className="mt-4">Длительность, минуты</Label>
            <Input
              id="meeting-type-duration"
              className="mt-1"
              type="number"
              min={15}
              max={120}
              step={15}
              value={draft.duration}
              onChange={(event) => updateField('duration', event.target.value)}
              aria-invalid={Boolean(errors.duration)}
              aria-describedby={errors.duration ? 'duration-error' : undefined}
            />
            {errors.duration && <p id="duration-error" role="alert" className="mt-1 text-sm text-red-700">{errors.duration}</p>}
            {notice && <p role="status" className="mt-4 text-sm text-green-700">{notice}</p>}
            {formError && <p role="alert" className="mt-4 text-sm text-red-700">{formError}</p>}
            <Button type="submit" size="lg" disabled={submitting} className="mt-6 w-full bg-slate-950 text-white hover:bg-slate-800">
              {submitting ? 'Создание…' : 'Создать тип встречи'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
