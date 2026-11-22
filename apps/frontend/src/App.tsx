import { useEffect, useState } from 'react'
import AdminPage from './pages/AdminPage'
import BookPage from './pages/BookPage'
import BookTypePage from './pages/BookTypePage'

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

function HealthPage() {
  const [status, setStatus] = useState('Проверяем API…')

  useEffect(() => {
    const controller = new AbortController()

    void fetch('/api/health', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error('API unavailable')
        }
        setStatus('API доступно')
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) {
          return
        }
        setStatus('API недоступно')
      })

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1>Календарь звонков</h1>
        <p>{status}</p>
      </div>
    </main>
  )
}

export default function App() {
  if (window.location.pathname === '/admin') {
    return <AdminPage />
  }

  if (window.location.pathname === '/book') {
    return <BookPage />
  }

  const typeId = window.location.pathname.match(/^\/book\/([^/]+)$/)?.[1]
  if (typeId) {
    return <BookTypePage id={decodeURIComponent(typeId)} />
  }

  return <HealthPage />
}
