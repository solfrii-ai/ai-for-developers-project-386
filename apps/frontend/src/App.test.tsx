import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function mockPendingHealthCheck() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {})),
  )
}

test('shows the project name as the main heading', () => {
  mockPendingHealthCheck()
  render(<App />)

  expect(
    screen.getByRole('heading', { level: 1, name: 'Календарь звонков' }),
  ).toBeInTheDocument()
})

test('shows that the API check is in progress', () => {
  mockPendingHealthCheck()
  render(<App />)

  expect(screen.getByText('Проверяем API…')).toBeInTheDocument()
  expect(screen.queryByText('API доступно')).not.toBeInTheDocument()
  expect(screen.queryByText('API недоступно')).not.toBeInTheDocument()
})

test('shows that the API is available after a successful response', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))),
  )
  render(<App />)

  expect(await screen.findByText('API доступно')).toBeInTheDocument()
  expect(screen.queryByText('Проверяем API…')).not.toBeInTheDocument()
  expect(screen.queryByText('API недоступно')).not.toBeInTheDocument()
})

test('shows that the API is unavailable when the request fails', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('network'))),
  )
  render(<App />)

  expect(await screen.findByText('API недоступно')).toBeInTheDocument()
  expect(screen.queryByText('Проверяем API…')).not.toBeInTheDocument()
  expect(screen.queryByText('API доступно')).not.toBeInTheDocument()
})

test('shows that the API is unavailable after an unsuccessful response', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(null, { status: 500 }))),
  )
  render(<App />)

  expect(await screen.findByText('API недоступно')).toBeInTheDocument()
  expect(screen.queryByText('Проверяем API…')).not.toBeInTheDocument()
  expect(screen.queryByText('API доступно')).not.toBeInTheDocument()
})

test('cancels the health check when the page is left', () => {
  let signal: AbortSignal | undefined
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    expect(input).toBe('/api/health')
    signal = init?.signal ?? undefined
    return new Promise<Response>(() => {})
  })
  vi.stubGlobal('fetch', fetchMock)
  const { unmount } = render(<App />)

  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(signal).toBeInstanceOf(AbortSignal)

  unmount()

  expect(signal?.aborted).toBe(true)
})
