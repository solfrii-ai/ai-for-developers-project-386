import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

type MeetingType = {
  id: string
  name: string
  description: string
  duration: number
}

type Draft = {
  name: string
  description: string
  duration: string
}

const initialTypes: MeetingType[] = [
  {
    id: 'k7m2x9p4',
    name: 'Знакомство',
    description: 'Обсуждаем задачу и определяем следующий шаг.',
    duration: 30,
  },
  {
    id: 'r4n8q1w6',
    name: 'Разбор проекта',
    description: 'Подробно разбираем текущее состояние проекта.',
    duration: 60,
  },
]

const emptyDraft: Draft = { name: '', description: '', duration: '30' }

const variantNames = {
  A: 'Две колонки',
  B: 'Форма сверху',
  C: 'Форма в диалоге',
} as const

type Variant = keyof typeof variantNames
const variants = Object.keys(variantNames) as Variant[]

function PrototypeHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="font-semibold text-slate-950">Календарь звонков</span>
        <nav className="flex items-center gap-5 text-sm text-slate-600">
          <a href="/book" className="hover:text-slate-950">Типы встреч</a>
          <a href="/upcoming" className="hover:text-slate-950">Предстоящие встречи</a>
        </nav>
      </div>
    </header>
  )
}

function TypeFields({
  draft,
  setDraft,
  idPrefix,
}: {
  draft: Draft
  setDraft: (draft: Draft) => void
  idPrefix: string
}) {
  return (
    <>
      <label className="block text-sm font-medium text-slate-700" htmlFor={`${idPrefix}-name`}>
        Название
      </label>
      <input
        id={`${idPrefix}-name`}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-900"
        value={draft.name}
        onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        placeholder="Например, Консультация"
        required
      />
      <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor={`${idPrefix}-description`}>
        Описание
      </label>
      <textarea
        id={`${idPrefix}-description`}
        className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-900"
        value={draft.description}
        onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        placeholder="Что гость получит от встречи"
        required
      />
      <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor={`${idPrefix}-duration`}>
        Длительность, минуты
      </label>
      <input
        id={`${idPrefix}-duration`}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-900"
        type="number"
        value={draft.duration}
        onChange={(event) => setDraft({ ...draft, duration: event.target.value })}
        required
      />
    </>
  )
}

function EmptyList() {
  return <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">Типов встреч пока нет. Создайте первый с помощью формы</p>
}

function VariantA({
  types,
  draft,
  setDraft,
  createType,
  notice,
}: {
  types: MeetingType[]
  draft: Draft
  setDraft: (draft: Draft) => void
  createType: (event: FormEvent) => void
  notice: string
}) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">Страница владельца</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950">Типы встреч</h1>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <h2 className="mb-4 text-lg font-medium text-slate-900">Существующие типы</h2>
          {types.length === 0 ? <EmptyList /> : (
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
        <form onSubmit={createType} className="rounded-xl border border-slate-200 bg-white p-6 lg:sticky lg:top-6">
          <h2 className="text-lg font-medium text-slate-950">Новый тип встречи</h2>
          <p className="mb-5 mt-1 text-sm text-slate-500">Id будет создан автоматически</p>
          <TypeFields draft={draft} setDraft={setDraft} idPrefix="a" />
          {notice && <p className="mt-4 text-sm text-green-700">{notice}</p>}
          <button className="mt-6 w-full rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white" type="submit">
            Создать тип встречи
          </button>
        </form>
      </div>
    </main>
  )
}

function VariantB({
  types,
  draft,
  setDraft,
  createType,
  notice,
}: {
  types: MeetingType[]
  draft: Draft
  setDraft: (draft: Draft) => void
  createType: (event: FormEvent) => void
  notice: string
}) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <form onSubmit={createType} className="rounded-2xl bg-slate-950 p-7 text-white">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Страница владельца</p>
            <h1 className="mt-1 text-2xl font-semibold">Создать тип встречи</h1>
          </div>
          <span className="text-sm text-slate-400">Id создаётся автоматически</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-slate-300" htmlFor="b-name">Название</label>
            <input
              id="b-name"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-white"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-300" htmlFor="b-duration">Длительность, минуты</label>
            <input
              id="b-duration"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-white"
              type="number"
              value={draft.duration}
              onChange={(event) => setDraft({ ...draft, duration: event.target.value })}
              required
            />
          </div>
        </div>
        <label className="mt-4 block text-sm text-slate-300" htmlFor="b-description">Описание</label>
        <textarea
          id="b-description"
          className="mt-1 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-white"
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          required
        />
        <div className="mt-5 flex items-center gap-4">
          <button className="rounded-lg bg-white px-5 py-2.5 font-medium text-slate-950" type="submit">Создать тип встречи</button>
          {notice && <p className="text-sm text-green-300">{notice}</p>}
        </div>
      </form>
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-950">Типы встреч</h2>
          <span className="text-sm text-slate-500">{types.length} всего</span>
        </div>
        {types.length === 0 ? <EmptyList /> : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {types.map((type) => (
              <article key={type.id} className="grid gap-2 border-b border-slate-200 p-4 last:border-0 md:grid-cols-[1fr_2fr_auto] md:items-center md:gap-6">
                <h3 className="font-medium text-slate-950">{type.name}</h3>
                <p className="text-sm text-slate-600">{type.description}</p>
                <span className="text-sm font-medium text-slate-700">{type.duration} мин</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function VariantC({
  types,
  draft,
  setDraft,
  createType,
  notice,
}: {
  types: MeetingType[]
  draft: Draft
  setDraft: (draft: Draft) => void
  createType: (event: FormEvent) => void
  notice: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Страница владельца</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Типы встреч</h1>
        </div>
        <button
          className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white"
          type="button"
          onClick={() => setOpen(true)}
        >
          Новый тип встречи
        </button>
      </div>
      {notice && <p className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
      <section className="mt-8">
        {types.length === 0 ? <EmptyList /> : (
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {types.map((type) => (
              <article key={type.id} className="py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-medium text-slate-950">{type.name}</h2>
                  <span className="text-sm text-slate-500">{type.duration} минут</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{type.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-6" role="presentation">
          <form onSubmit={(event) => { createType(event); setOpen(false) }} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="c-dialog-title">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="c-dialog-title" className="text-xl font-semibold text-slate-950">Новый тип встречи</h2>
                <p className="mt-1 text-sm text-slate-500">Id будет создан автоматически</p>
              </div>
              <button className="text-xl text-slate-500" type="button" onClick={() => setOpen(false)} aria-label="Закрыть">×</button>
            </div>
            <TypeFields draft={draft} setDraft={setDraft} idPrefix="c" />
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-lg px-4 py-2 text-slate-600" type="button" onClick={() => setOpen(false)}>Отмена</button>
              <button className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white" type="submit">Создать тип встречи</button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}

function PrototypeSwitcher({ variant, setVariant }: { variant: Variant; setVariant: (variant: Variant) => void }) {
  const move = (direction: number) => {
    const index = variants.indexOf(variant)
    setVariant(variants[(index + direction + variants.length) % variants.length])
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return
      if (event.key === 'ArrowLeft') move(-1)
      if (event.key === 'ArrowRight') move(1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!import.meta.env.DEV) return null

  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full bg-slate-950 px-4 py-2 text-sm text-white shadow-xl">
      <button type="button" onClick={() => move(-1)} aria-label="Предыдущий вариант">←</button>
      <span>{variant} · {variantNames[variant]}</span>
      <button type="button" onClick={() => move(1)} aria-label="Следующий вариант">→</button>
    </div>
  )
}

export default function AdminPrototype(): ReactNode {
  const initialVariant = new URLSearchParams(window.location.search).get('variant')
  const [variant, setVariantState] = useState<Variant>(variants.includes(initialVariant as Variant) ? initialVariant as Variant : 'A')
  const [types, setTypes] = useState(initialTypes)
  const [draft, setDraft] = useState(emptyDraft)
  const [notice, setNotice] = useState('')

  const setVariant = (next: Variant) => {
    setVariantState(next)
    const url = new URL(window.location.href)
    url.searchParams.set('variant', next)
    window.history.replaceState(null, '', url)
  }

  const createType = (event: FormEvent) => {
    event.preventDefault()
    const id = `proto-${Date.now().toString(36)}`
    setTypes([...types, { id, name: draft.name, description: draft.description, duration: Number(draft.duration) }])
    setDraft(emptyDraft)
    setNotice(`Тип встречи создан. Автоматический id: ${id}`)
  }

  const shared = { types, draft, setDraft, createType, notice }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 text-slate-900">
      <PrototypeHeader />
      <div className="bg-amber-100 px-6 py-2 text-center text-xs font-medium tracking-wide text-amber-900">
        PROTOTYPE · данные только в памяти · вариант {variant}
      </div>
      {variant === 'A' && <VariantA {...shared} />}
      {variant === 'B' && <VariantB {...shared} />}
      {variant === 'C' && <VariantC {...shared} />}
      <details className="mx-auto mt-10 max-w-6xl rounded-lg border border-dashed border-slate-400 bg-white p-4 text-xs text-slate-600">
        <summary className="cursor-pointer font-medium">Состояние прототипа</summary>
        <pre className="mt-3 overflow-auto whitespace-pre-wrap">{JSON.stringify({ variant, types, draft, notice }, null, 2)}</pre>
      </details>
      <PrototypeSwitcher variant={variant} setVariant={setVariant} />
    </div>
  )
}
