import { useEffect, useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { components } from '@/api/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type MeetingType = components['schemas']['MeetingType']
type Availability = components['schemas']['Availability']
type AvailabilitySlot = components['schemas']['AvailabilitySlot']

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function formatDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T00:00:00.000Z`))
}

function formatMonth(month: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${month}-01T00:00:00.000Z`))
}

function formatTime(value: string) {
  const date = new Date(value)
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function formatInterval(slot: AvailabilitySlot) {
  return `${formatTime(slot.start)} - ${formatTime(slot.end)}`
}

function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year ?? 0, (monthIndex ?? 1) - 1 + offset, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthCells(month: string) {
  const [year, monthIndex] = month.split('-').map(Number)
  const first = new Date(Date.UTC(year ?? 0, (monthIndex ?? 1) - 1, 1))
  const leading = (first.getUTCDay() + 6) % 7
  const count = new Date(Date.UTC(year ?? 0, monthIndex ?? 1, 0)).getUTCDate()

  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`),
  ]
}

export default function BookTypePage({ id }: { id: string }) {
  const [type, setType] = useState<MeetingType | null>(null)
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [visibleMonth, setVisibleMonth] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [view, setView] = useState<'slots' | 'confirm' | 'done'>('slots')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'guestName' | 'guestEmail', string>>>({})
  const [conflict, setConflict] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    void apiClient.GET('/api/meeting-types/{id}', {
      params: { path: { id } },
      signal: controller.signal,
    }).then(async (typeResult) => {
      if (controller.signal.aborted) {
        return
      }
      if (typeResult.response.status === 404) {
        window.location.replace('/book')
        return
      }
      if (typeResult.error || !typeResult.data) {
        setLoadError('Не удалось загрузить тип встречи')
        setLoading(false)
        return
      }

      const availabilityResult = await apiClient.GET('/api/meeting-types/{id}/availability', {
        params: { path: { id } },
        signal: controller.signal,
      })
      if (controller.signal.aborted) {
        return
      }
      if (availabilityResult.response.status === 404) {
        window.location.replace('/book')
        return
      }
      if (availabilityResult.error || !availabilityResult.data) {
        setLoadError('Не удалось загрузить свободные слоты')
        setLoading(false)
        return
      }

      const firstFree = availabilityResult.data.days.find((day) => day.freeCount > 0) ?? availabilityResult.data.days[0]
      setType(typeResult.data)
      setAvailability(availabilityResult.data)
      setSelectedDate(firstFree?.date ?? '')
      setVisibleMonth(firstFree?.date.slice(0, 7) ?? '')
      setLoading(false)
    }).catch(() => {
      if (!controller.signal.aborted) {
        setLoadError('Не удалось загрузить тип встречи')
        setLoading(false)
      }
    })

    return () => controller.abort()
  }, [id])

  const reloadAvailability = async () => {
    const result = await apiClient.GET('/api/meeting-types/{id}/availability', {
      params: { path: { id } },
    })
    if (result.data) {
      setAvailability(result.data)
    }
  }

  const confirmBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors: Partial<Record<'guestName' | 'guestEmail', string>> = {}
    if (!guestName.trim()) {
      errors.guestName = 'Введите имя'
    }
    if (!guestEmail.trim()) {
      errors.guestEmail = 'Введите почту'
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0 || !selectedSlot) {
      return
    }

    setSubmitting(true)
    try {
      const result = await apiClient.POST('/api/bookings', {
        body: {
          meetingTypeId: id,
          start: selectedSlot,
          guestName,
          guestEmail,
        },
      })
      if (result.response.status === 409) {
        const message = result.error && 'message' in result.error ? result.error.message : ''
        setConflict(message)
        setSelectedSlot('')
        setView('slots')
        await reloadAvailability()
        return
      }
      if (result.response.status === 400 && result.error && 'errors' in result.error) {
        const nextErrors: Partial<Record<'guestName' | 'guestEmail', string>> = {}
        for (const item of result.error.errors) {
          if (item.field === 'guestName' || item.field === 'guestEmail') {
            nextErrors[item.field] = item.message
          }
        }
        setFieldErrors(nextErrors)
        return
      }
      if (!result.data) {
        setConflict('Не удалось создать бронирование')
        return
      }
      setConflict('')
      setView('done')
      await reloadAvailability()
    } finally {
      setSubmitting(false)
    }
  }

  const days = availability?.days ?? []
  const months = [...new Set(days.map((day) => day.date.slice(0, 7)))]
  const selectedDay = days.find((day) => day.date === selectedDate)
  const windowEmpty = days.length > 0 && days.every((day) => day.freeCount === 0)
  const slots = (availability?.slots ?? []).filter((slot) => slot.start.startsWith(selectedDate))
  const selected = availability?.slots.find((slot) => slot.start === selectedSlot)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 font-semibold text-slate-950">Календарь звонков</div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <a href="/book" className="text-sm font-medium text-slate-700 underline underline-offset-4">Назад</a>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Бронирование встречи</h1>
        {loading ? (
          <p className="mt-8 text-sm text-slate-600">Загрузка свободных слотов…</p>
        ) : loadError ? (
          <p role="alert" className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-700">{loadError}</p>
        ) : type && availability ? (
          <div className="mt-8 grid items-start gap-4 lg:grid-cols-3">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-medium text-slate-950">Информация</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-lg bg-slate-100 p-3">
                  <p className="text-slate-500">Тип встречи</p>
                  <h2 className="mt-1 font-medium text-slate-950">{type.name}</h2>
                  <p className="mt-1 text-slate-600">{type.description}</p>
                </div>
                <div className="rounded-lg bg-slate-100 p-3">
                  <p className="text-slate-500">Выбранная дата</p>
                  <p className="mt-1 font-medium text-slate-950">{selectedDate ? formatDate(selectedDate) : 'Не выбрана'}</p>
                </div>
                <div className="rounded-lg bg-slate-100 p-3">
                  <p className="text-slate-500">Выбранное время</p>
                  <p className="mt-1 font-medium text-slate-950">{selected ? formatInterval(selected) : 'Не выбрано'}</p>
                </div>
                <div className="rounded-lg bg-slate-100 p-3">
                  <p className="text-slate-500">Свободно</p>
                  <p className="mt-1 font-medium text-slate-950">{selectedDay?.freeCount ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-100 p-3">
                  <p className="text-slate-500">Длительность</p>
                  <p className="mt-1 font-medium text-slate-950">{type.duration} мин</p>
                </div>
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-medium text-slate-950">Календарь</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Предыдущий месяц"
                    className="size-8 rounded-full border border-slate-200 text-slate-700 disabled:opacity-40"
                    disabled={visibleMonth === months[0]}
                    onClick={() => setVisibleMonth(shiftMonth(visibleMonth, -1))}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Следующий месяц"
                    className="size-8 rounded-full border border-slate-200 text-slate-700 disabled:opacity-40"
                    disabled={visibleMonth === months.at(-1)}
                    onClick={() => setVisibleMonth(shiftMonth(visibleMonth, 1))}
                  >
                    ›
                  </button>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">{visibleMonth ? formatMonth(visibleMonth) : ''}</p>
              <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
                {weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {monthCells(visibleMonth).map((date, index) => {
                  const day = days.find((item) => item.date === date)
                  if (!date || !day) {
                    return <span key={date ?? `empty-${index}`} className="py-2 text-center text-sm text-slate-300">{date ? Number(date.slice(8)) : ''}</span>
                  }

                  return (
                    <button
                      key={date}
                      type="button"
                      aria-pressed={date === selectedDate}
                      aria-label={`${formatDate(date)}, ${day.freeCount}`}
                      className={`rounded-lg border px-1 py-2 text-sm ${date === selectedDate ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white'}`}
                      onClick={() => {
                        setSelectedDate(date)
                        setSelectedSlot('')
                      }}
                    >
                      <span className="block">{Number(date.slice(8))}</span>
                      <span className="block text-xs text-slate-500">{day.freeCount} св.</span>
                    </button>
                  )
                })}
              </div>
            </section>
            <section aria-labelledby="slot-status" className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 id="slot-status" className="font-medium text-slate-950">Статус слотов</h2>
              {view === 'done' ? (
                <p role="status" className="mt-4 text-sm text-green-700">Бронирование подтверждено. До встречи!</p>
              ) : view === 'confirm' && selected ? (
                <form aria-label="Подтверждение бронирования" noValidate onSubmit={confirmBooking} className="mt-4 space-y-4">
                  <p className="text-sm text-slate-600">{type.name}, {formatInterval(selected)}</p>
                  <div>
                    <Label htmlFor="guest-name">Имя</Label>
                    <Input id="guest-name" className="mt-1" value={guestName} onChange={(event) => setGuestName(event.target.value)} aria-invalid={Boolean(fieldErrors.guestName)} aria-describedby={fieldErrors.guestName ? 'guest-name-error' : undefined} />
                    {fieldErrors.guestName && <p id="guest-name-error" role="alert" className="mt-1 text-sm text-red-700">{fieldErrors.guestName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="guest-email">Почта</Label>
                    <Input id="guest-email" className="mt-1" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} aria-invalid={Boolean(fieldErrors.guestEmail)} aria-describedby={fieldErrors.guestEmail ? 'guest-email-error' : undefined} />
                    {fieldErrors.guestEmail && <p id="guest-email-error" role="alert" className="mt-1 text-sm text-red-700">{fieldErrors.guestEmail}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setView('slots')}>Назад</Button>
                    <Button type="submit" disabled={submitting} className="bg-slate-950 text-white hover:bg-slate-800">{submitting ? 'Подтверждение…' : 'Подтвердить бронирование'}</Button>
                  </div>
                </form>
              ) : (
                <div className="mt-4 space-y-3">
                  {conflict && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{conflict}</p>}
                  {windowEmpty ? (
                    <div>
                      <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">В ближайшие 14 дней свободных слотов нет</p>
                      <a href="/book" className="mt-4 inline-flex text-sm font-medium text-slate-700 underline underline-offset-4">Выбрать другой тип встречи</a>
                    </div>
                  ) : selectedDay?.freeCount === 0 ? (
                    <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">На эту дату свободных слотов нет. Выберите другую дату</p>
                  ) : (
                    <div className="space-y-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      aria-pressed={slot.start === selectedSlot}
                      className={`flex w-full justify-between rounded-lg border px-3 py-2 text-sm ${slot.start === selectedSlot ? 'border-orange-400 bg-orange-50' : 'border-slate-200'}`}
                      onClick={() => {
                        setSelectedSlot(slot.start)
                        setConflict('')
                      }}
                    >
                      <span>{formatInterval(slot)}</span>
                      <span className="text-slate-500">Свободно</span>
                    </button>
                  ))}
                  <Button type="button" disabled={!selectedSlot} onClick={() => setView('confirm')} className="mt-2 w-full bg-slate-950 text-white hover:bg-slate-800">Продолжить</Button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  )
}
