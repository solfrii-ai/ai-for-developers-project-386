import { expect, test } from '@playwright/test'

test('landing links to booking and the public upcoming list', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Бронирование встреч без регистрации', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Что доступно прямо сейчас', exact: true })).toBeVisible()
  await expect(page.getByText('14 календарных дней', { exact: true })).toBeVisible()
  await expect(page.getByText('Будни, 09:00–18:00', { exact: true })).toBeVisible()
  await expect(page.getByText('Длительность и шаг — по типу встречи', { exact: true })).toBeVisible()
  await expect(page.getByText('Один экран, понятные слоты')).toHaveCount(0)
  await expect(page.getByText('Calendar')).toHaveCount(0)
  await expect(page.locator('footer')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Забронировать' })).toHaveCount(2)
  for (const link of await page.getByRole('link', { name: 'Забронировать' }).all()) {
    await expect(link).toHaveAttribute('href', '/book')
  }
  await expect(page.getByRole('link', { name: 'Календарь звонков' })).toHaveAttribute('href', '/')
  await page.getByRole('link', { name: 'Предстоящие встречи' }).click()
  await expect(page).toHaveURL(/\/upcoming$/)
  await expect(page.getByText('Предстоящих встреч нет', { exact: true })).toBeVisible()
  await page.getByRole('main').getByRole('link', { name: 'Забронировать', exact: true }).click()
  await expect(page).toHaveURL(/\/book$/)

  const type = await request.post('/api/meeting-types', {
    data: { name: 'Консультация', description: 'Обсуждаем задачу', duration: 30 },
  })
  const created = await type.json() as { id: string }
  const booked = await request.post('/api/bookings', {
    data: {
      meetingTypeId: created.id,
      start: '2026-03-02T09:00:00.000Z',
      guestName: 'Гость',
      guestEmail: 'guest@example.com',
    },
  })
  expect(booked.ok()).toBeTruthy()

  await page.goto('/upcoming')
  const row = page.getByRole('article')
  await expect(row).toContainText('Консультация')
  await expect(row).toContainText('Гость')
  await expect(row).toContainText('guest@example.com')
  await expect(row).toContainText('02.03.2026, 09:00 - 09:30')
  await expect(row).toContainText('02.03.2026, 08:00')
  await expect(page.getByText('UTC')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Редактировать|Отменить|Перенести/ })).toHaveCount(0)
})
