import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
})

test('shows the landing headline without a description', () => {
  render(<App />)

  expect(screen.getByRole('heading', { level: 1, name: 'Бронирование встреч без регистрации' })).toBeInTheDocument()
  expect(screen.queryByText('Проверяем API…')).not.toBeInTheDocument()
  expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
})
