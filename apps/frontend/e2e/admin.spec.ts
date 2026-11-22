import { expect, test } from '@playwright/test'

test('owner validates, creates, and reopens meeting types', async ({ page }) => {
  await page.goto('/admin')

  await expect(page.getByRole('heading', { name: 'Типы встреч', exact: true })).toBeVisible()
  await expect(page.getByText('Типов встреч пока нет. Создайте первый с помощью формы', { exact: true })).toBeVisible()

  const list = page.getByRole('region', { name: 'Существующие типы' })
  const form = page.getByRole('form', { name: 'Новый тип встречи' })
  const wideList = await list.boundingBox()
  const wideForm = await form.boundingBox()
  expect(wideList!.x).toBeLessThan(wideForm!.x)

  await page.setViewportSize({ width: 800, height: 900 })
  const narrowList = await list.boundingBox()
  const narrowForm = await form.boundingBox()
  expect(narrowList!.y).toBeLessThan(narrowForm!.y)
  await page.setViewportSize({ width: 1280, height: 900 })

  const name = page.getByLabel('Название', { exact: true })
  const description = page.getByLabel('Описание', { exact: true })
  const duration = page.getByLabel('Длительность, минуты', { exact: true })
  const submit = page.getByRole('button', { name: 'Создать тип встречи' })

  await expect(page.getByLabel('Id', { exact: true })).toHaveCount(0)
  await name.fill('   ')
  await description.fill('   ')
  await duration.fill('20')
  await submit.click()

  await expect(page.locator('#name-error')).toBeVisible()
  await expect(page.locator('#description-error')).toBeVisible()
  await expect(page.locator('#duration-error')).toBeVisible()
  await expect(name).toHaveValue('   ')
  await expect(description).toHaveValue('   ')
  await expect(duration).toHaveValue('20')
  await expect(page.getByText('Типов встреч пока нет. Создайте первый с помощью формы', { exact: true })).toBeVisible()

  await name.fill('  Консультация  ')
  await description.fill('  Обсуждаем задачу  ')
  await duration.fill('45')
  await submit.click()

  const status = page.getByRole('status')
  await expect(status).toHaveText(/^Тип встречи создан\. Автоматический id: [a-z0-9]{3}-[a-z0-9]{5}$/)
  const firstId = (await status.textContent())!.split(': ').at(-1)!
  await expect(page).toHaveURL(/\/admin$/)
  await expect(name).toHaveValue('')
  await expect(description).toHaveValue('')
  await expect(duration).toHaveValue('')

  const cards = page.getByRole('article')
  await expect(cards).toHaveCount(1)
  await expect(cards.first()).toContainText('Консультация')
  await expect(cards.first()).toContainText('Обсуждаем задачу')
  await expect(cards.first()).toContainText('45 мин')
  await expect(cards.first()).not.toContainText(firstId)

  await name.fill('Консультация')
  await description.fill('Вторая встреча')
  await duration.fill('60')
  await submit.click()

  await expect(cards).toHaveCount(2)
  const secondId = (await status.textContent())!.split(': ').at(-1)!
  expect(secondId).toMatch(/^[a-z0-9]{3}-[a-z0-9]{5}$/)
  expect(secondId).not.toBe(firstId)
  await expect(cards.nth(0)).toContainText('Обсуждаем задачу')
  await expect(cards.nth(1)).toContainText('Вторая встреча')
  await expect(cards.nth(1)).toContainText('60 мин')
  await expect(cards.nth(1)).not.toContainText(secondId)

  await page.reload()
  await expect(cards).toHaveCount(2)
  await expect(cards.nth(0)).toContainText('Обсуждаем задачу')
  await expect(cards.nth(1)).toContainText('Вторая встреча')
})
