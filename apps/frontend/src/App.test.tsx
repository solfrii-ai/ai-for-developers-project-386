import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('shows the project name as the main heading', () => {
  render(<App />)

  expect(
    screen.getByRole('heading', { level: 1, name: 'Календарь звонков' }),
  ).toBeInTheDocument()
})
