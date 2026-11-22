import { useEffect, useState } from 'react'
import { apiClient } from '@/api/client'
import type { components } from '@/api/schema'

type UpcomingMeeting = components['schemas']['UpcomingMeeting']

function formatTime(value: string) {
  const date = new Date(value)
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`
}

function formatDateTime(value: string) {
  const date = new Date(value)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${date.getUTCFullYear()}, ${formatTime(value)}`
}

export default function UpcomingPage() {
  const [meetings, setMeetings] = useState<UpcomingMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    void apiClient.GET('/api/upcoming', { signal: controller.signal })
      .then(({ data, error }) => {
        if (controller.signal.aborted) {
          return
        }
        if (error || !data) {
          setLoadError('Не удалось загрузить предстоящие встречи')
          return
        }
        setMeetings(data)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadError('Не удалось загрузить предстоящие встречи')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="font-semibold text-slate-950">Календарь звонков</a>
          <nav className="flex items-center gap-2 text-sm">
            <a href="/book" className="rounded-lg px-3 py-2 text-slate-700">Забронировать</a>
            <a href="/upcoming" className="rounded-lg bg-slate-100 px-3 py-2 text-slate-950">Предстоящие встречи</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold text-slate-950">Предстоящие встречи</h1>
        {loading ? (
          <p className="mt-8 text-sm text-slate-600">Загрузка предстоящих встреч…</p>
        ) : loadError ? (
          <p role="alert" className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-700">{loadError}</p>
        ) : meetings.length === 0 ? (
          <div className="mt-8">
            <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">Предстоящих встреч нет</p>
            <a href="/book" className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white">Забронировать</a>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {meetings.map((meeting) => (
              <article key={`${meeting.start}-${meeting.guestEmail}`} className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="font-medium text-slate-950">{meeting.meetingTypeName}</h2>
                <p className="mt-2 text-sm text-slate-700">{meeting.guestName}</p>
                <p className="text-sm text-slate-600">{meeting.guestEmail}</p>
                <p className="mt-3 text-sm text-slate-700">{formatTime(meeting.start)} - {formatTime(meeting.end)}</p>
                <p className="text-sm text-slate-500">Создано: {formatDateTime(meeting.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
