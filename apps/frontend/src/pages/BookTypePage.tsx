import { useEffect, useState } from 'react'
import { apiClient } from '@/api/client'
import type { components } from '@/api/schema'

type MeetingType = components['schemas']['MeetingType']

export default function BookTypePage({ id }: { id: string }) {
  const [type, setType] = useState<MeetingType | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    void apiClient.GET('/api/meeting-types/{id}', {
      params: { path: { id } },
      signal: controller.signal,
    })
      .then(({ data, error, response }) => {
        if (controller.signal.aborted) {
          return
        }
        if (response.status === 404) {
          window.location.replace('/book')
          return
        }
        if (error || !data) {
          setLoadError('Не удалось загрузить тип встречи')
          return
        }
        setType(data)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadError('Не удалось загрузить тип встречи')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [id])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 font-semibold text-slate-950">
          Календарь звонков
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <a href="/book" className="text-sm font-medium text-slate-700 underline underline-offset-4">Назад</a>
        {loading ? (
          <p className="mt-8 text-sm text-slate-600">Загрузка типа встречи…</p>
        ) : loadError ? (
          <p role="alert" className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-700">{loadError}</p>
        ) : type ? (
          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <h1 className="text-3xl font-semibold text-slate-950">{type.name}</h1>
            <p className="mt-4 leading-7 text-slate-600">{type.description}</p>
            <p className="mt-6 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{type.duration} мин</p>
          </section>
        ) : null}
      </main>
    </div>
  )
}
