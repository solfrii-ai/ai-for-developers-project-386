import { useEffect, useState } from 'react'
import { apiClient } from '@/api/client'
import type { components } from '@/api/schema'

type MeetingType = components['schemas']['MeetingType']

export default function BookPage() {
  const [types, setTypes] = useState<MeetingType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 font-semibold text-slate-950">
          Календарь звонков
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-semibold text-slate-950">Типы встреч</h1>
        {loading ? (
          <p className="mt-8 text-sm text-slate-600">Загрузка типов встреч…</p>
        ) : loadError ? (
          <p role="alert" className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-700">{loadError}</p>
        ) : types.length === 0 ? (
          <>
            <p className="mt-8 rounded-lg bg-slate-100 p-4 text-sm text-slate-600">Пока нет типов встреч для бронирования</p>
            <a href="/" className="mt-6 inline-flex text-sm font-medium text-slate-700 underline underline-offset-4">На главную</a>
          </>
        ) : (
          <div className="mt-8 space-y-3">
            {types.map((type) => (
              <article key={type.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-medium text-slate-950">
                      <a href={`/book/${type.id}`} className="underline-offset-4 hover:underline">{type.name}</a>
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{type.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{type.duration} мин</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
