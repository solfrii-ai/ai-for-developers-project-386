import { expect, test } from '@playwright/test'

test('guest opens the catalog, a saved type, and an unknown id', async ({ page, request }) => {
  await page.goto('/book')

  await expect(page.getByRole('heading', { name: 'Типы встреч', exact: true })).toBeVisible()
  await expect(page.getByText('Пока нет типов встреч для бронирования', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'На главную', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)

  const created = await request.post('/api/meeting-types', {
    data: {
      name: 'Знакомство',
      description: 'Обсуждаем цели и контекст',
      duration: 15,
    },
  })
  expect(created.ok()).toBeTruthy()
  const type = await created.json() as { id: string }

  await page.goto('/book')
  const card = page.getByRole('article')
  await expect(card).toContainText('Знакомство')
  await expect(card).toContainText('Обсуждаем цели и контекст')
  await expect(card).toContainText('15 мин')
  await expect(card).not.toContainText(type.id)
  await expect(page.getByLabel('Id')).toHaveCount(0)

  await page.getByRole('link', { name: 'Знакомство', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/book/${type.id}$`))
  await expect(page.getByRole('heading', { name: 'Знакомство', exact: true })).toBeVisible()
  await expect(page.getByText('Обсуждаем цели и контекст', { exact: true })).toBeVisible()
  await expect(page.getByText('15 мин', { exact: true })).toBeVisible()
  await expect(page.getByText(type.id)).toHaveCount(0)

  await page.goto(`/book/${type.id}`)
  await expect(page.getByRole('heading', { name: 'Знакомство', exact: true })).toBeVisible()

  await page.goto('/book/aaa-aaaaa')
  await expect(page).toHaveURL(/\/book$/)
  await expect(page.getByRole('heading', { name: 'Типы встреч', exact: true })).toBeVisible()
  await expect(page.getByText('Тип встречи не найден')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Календарь', exact: true })).toHaveCount(0)
})
