import { expect, test } from '@playwright/test'

test('guest sees free UTC slots, an empty day, and no dates outside the window', async ({ page, request }) => {
  const created = await request.post('/api/meeting-types', {
    data: {
      name: 'Консультация',
      description: 'Обсуждаем задачу',
      duration: 30,
    },
  })
  expect(created.ok()).toBeTruthy()
  const type = await created.json() as { id: string }

  await page.goto(`/book/${type.id}`)
  await expect(page.getByRole('heading', { name: 'Бронирование встречи', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Календарь', exact: true })).toBeVisible()
  await expect(page.getByText('UTC')).toHaveCount(0)
  await expect(page.getByText(type.id)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'понедельник, 2 марта, 18' })).toContainText('18 св.')
  await expect(page.getByText('09:00 - 09:30', { exact: true })).toBeVisible()
  await expect(page.getByText('17:30 - 18:00', { exact: true })).toBeVisible()
  await expect(page.getByText('09:15 - 09:45')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /16 марта/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Следующий месяц' })).toBeDisabled()

  await page.getByRole('button', { name: 'суббота, 7 марта, 0' }).click()
  await expect(page.getByText('На эту дату свободных слотов нет. Выберите другую дату', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Календарь', exact: true })).toBeVisible()

  const longer = await request.post('/api/meeting-types', {
    data: {
      name: 'Разбор',
      description: 'Смотрим детали',
      duration: 45,
    },
  })
  const longerType = await longer.json() as { id: string }
  await page.goto(`/book/${longerType.id}`)
  await expect(page.getByText('09:00 - 09:45', { exact: true })).toBeVisible()
  await expect(page.getByText('09:45 - 10:30', { exact: true })).toBeVisible()
  await expect(page.getByText('17:15 - 18:00', { exact: true })).toBeVisible()
  await expect(page.getByText('09:15 - 10:00')).toHaveCount(0)
})

test('empty availability window stays on the catalog link', async ({ page, request }) => {
  const created = await request.post('/api/meeting-types', {
    data: {
      name: 'Пустое окно',
      description: 'Нет свободных слотов',
      duration: 30,
    },
  })
  const type = await created.json() as { id: string }
  await page.route('**/api/meeting-types/*/availability', async (route) => {
    const days = Array.from({ length: 14 }, (_, index) => ({
      date: new Date(Date.UTC(2026, 2, 2 + index)).toISOString().slice(0, 10),
      freeCount: 0,
    }))
    await route.fulfill({ json: { days, slots: [] } })
  })

  await page.goto(`/book/${type.id}`)
  await expect(page.getByText('В ближайшие 14 дней свободных слотов нет', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Выбрать другой тип встречи', exact: true })).toHaveAttribute('href', '/book')
  await expect(page.getByRole('heading', { name: 'Календарь', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Следующий месяц' })).toBeDisabled()
  await expect(page.getByText('апрель', { exact: false })).toHaveCount(0)
  await page.getByRole('link', { name: 'Выбрать другой тип встречи', exact: true }).click()
  await expect(page).toHaveURL(/\/book$/)
})
