export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="font-semibold text-slate-950">Календарь звонков</a>
          <nav className="flex items-center gap-2 text-sm">
            <a href="/book" className="rounded-lg px-3 py-2 text-slate-700">Забронировать</a>
            <a href="/upcoming" className="rounded-lg px-3 py-2 text-slate-700">Предстоящие встречи</a>
          </nav>
        </div>
      </header>
      <main className="bg-gradient-to-br from-slate-100 to-orange-50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950">Бронирование встреч без регистрации</h1>
            <a href="/book" className="mt-8 inline-flex rounded-lg bg-orange-500 px-5 py-3 font-medium text-white">Забронировать</a>
          </section>
          <aside className="rounded-2xl border border-orange-100 bg-orange-50/80 p-6">
            <h2 className="text-lg font-semibold text-slate-950">Что доступно прямо сейчас</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-sm text-slate-600">
              <li>14 календарных дней</li>
              <li>Будни, 09:00–18:00</li>
              <li>Длительность и шаг — по типу встречи</li>
            </ul>
          </aside>
        </div>
      </main>
    </div>
  )
}
