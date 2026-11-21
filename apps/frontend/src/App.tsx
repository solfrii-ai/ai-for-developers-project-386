import { useEffect, useState } from 'react'

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

export default function App() {
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
