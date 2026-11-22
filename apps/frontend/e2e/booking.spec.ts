import { expect, test } from '@playwright/test'

test('guest books a free slot and does not see it again', async ({ page, request }) => {
  const created = await request.post('/api/meeting-types', {
    data: { name: 'Консультация', description: 'Обсуждаем задачу', duration: 30 },
  })
  const type = await created.json() as { id: string }

  await page.goto(`/book/${type.id}`)
  await page.getByRole('button', { name: '09:00 - 09:30' }).click()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await expect(page.getByLabel('Имя')).toBeVisible()
  await expect(page.getByLabel('Почта')).toBeVisible()
  await expect(page.getByLabel('Телефон')).toHaveCount(0)
  await expect(page.getByLabel('Комментарий')).toHaveCount(0)

  await page.getByLabel('Имя').fill('   ')
  await page.getByLabel('Почта').fill('   ')
  await page.getByRole('button', { name: 'Подтвердить бронирование' }).click()
  await expect(page.locator('#guest-name-error')).toBeVisible()
  await expect(page.locator('#guest-email-error')).toBeVisible()
  await expect(page.getByLabel('Имя')).toHaveValue('   ')
  await expect(page.getByLabel('Почта')).toHaveValue('   ')
  await expect(page.getByText('Бронирование подтверждено. До встречи!')).toHaveCount(0)

  await page.getByLabel('Имя').fill('  Гость  ')
  await page.getByLabel('Почта').fill('guest@example.com')
  await page.getByRole('button', { name: 'Подтвердить бронирование' }).click()
  await expect(page.getByRole('status')).toHaveText('Бронирование подтверждено. До встречи!')

  await page.reload()
  await expect(page.getByRole('button', { name: '09:00 - 09:30' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'понедельник, 2 марта, 17' })).toBeVisible()
  await expect(page.getByText('Занято')).toHaveCount(0)

  await page.getByRole('button', { name: '09:30 - 10:00' }).click()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await page.getByLabel('Имя').fill('Гость')
  await page.getByLabel('Почта').fill('guest@example.com')
  await page.getByRole('button', { name: 'Подтвердить бронирование' }).click()
  await expect(page.getByRole('status')).toHaveText('Бронирование подтверждено. До встречи!')
})

test('occupied intervals stay hidden and a lost confirmation preserves the guest', async ({ page, request }) => {
  const hour = await request.post('/api/meeting-types', {
    data: { name: 'Час', description: 'Длинная встреча', duration: 60 },
  })
  const half = await request.post('/api/meeting-types', {
    data: { name: 'Полчаса', description: 'Короткая встреча', duration: 30 },
  })
  const hourType = await hour.json() as { id: string }
  const halfType = await half.json() as { id: string }
  const booked = await request.post('/api/bookings', {
    data: {
      meetingTypeId: hourType.id,
      start: '2026-03-02T10:00:00.000Z',
      guestName: 'Первый',
      guestEmail: 'first@example.com',
    },
  })
  expect(booked.ok()).toBeTruthy()

  await page.goto(`/book/${halfType.id}`)
  await expect(page.getByRole('button', { name: '10:00 - 10:30' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '10:30 - 11:00' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '11:00 - 11:30' })).toBeVisible()

  await page.getByRole('button', { name: '11:00 - 11:30' }).click()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await page.getByLabel('Имя').fill('Второй')
  await page.getByLabel('Почта').fill('second@example.com')
  const taken = await request.post('/api/bookings', {
    data: {
      meetingTypeId: halfType.id,
      start: '2026-03-02T11:00:00.000Z',
      guestName: 'Третий',
      guestEmail: 'third@example.com',
    },
  })
  expect(taken.ok()).toBeTruthy()

  await page.getByRole('button', { name: 'Подтвердить бронирование' }).click()
  await expect(page.getByRole('alert')).toHaveText('Встреча не создана: выбранный слот уже занят. Выберите другой свободный слот.')
  await expect(page.getByRole('button', { name: '11:00 - 11:30' })).toHaveCount(0)
  await expect(page.locator('button', { hasText: 'Свободно' }).and(page.locator('[aria-pressed="true"]'))).toHaveCount(0)
  await page.getByRole('button', { name: '11:30 - 12:00' }).click()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await expect(page.getByLabel('Имя')).toHaveValue('Второй')
  await expect(page.getByLabel('Почта')).toHaveValue('second@example.com')
})

test('a lost last slot still shows the conflict message', async ({ page, request }) => {
  const created = await request.post('/api/meeting-types', {
    data: { name: 'Последний слот', description: 'Остался один интервал', duration: 30 },
  })
  const type = await created.json() as { id: string }
  const availability = await request.get(`/api/meeting-types/${type.id}/availability`)
  const monday = (await availability.json() as { slots: { start: string, end: string }[] }).slots
    .filter((slot) => slot.start.startsWith('2026-03-02'))
  const last = monday.at(-1)
  if (!last) {
    throw new Error('Monday has no free slot')
  }
  for (const slot of monday.slice(0, -1)) {
    const booked = await request.post('/api/bookings', {
      data: {
        meetingTypeId: type.id,
        start: slot.start,
        guestName: 'Занято',
        guestEmail: 'taken@example.com',
      },
    })
    expect(booked.ok()).toBeTruthy()
  }

  const label = `${last.start.slice(11, 16)} - ${last.end.slice(11, 16)}`
  await page.goto(`/book/${type.id}`)
  await page.getByRole('button', { name: label }).click()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await page.getByLabel('Имя').fill('Гость')
  await page.getByLabel('Почта').fill('guest@example.com')
  const taken = await request.post('/api/bookings', {
    data: {
      meetingTypeId: type.id,
      start: last.start,
      guestName: 'Другой',
      guestEmail: 'other@example.com',
    },
  })
  expect(taken.ok()).toBeTruthy()

  await page.getByRole('button', { name: 'Подтвердить бронирование' }).click()
  await expect(page.getByRole('alert')).toHaveText('Встреча не создана: выбранный слот уже занят. Выберите другой свободный слот.')
  await expect(page.getByText('На эту дату свободных слотов нет. Выберите другую дату', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /вторник, 3 марта/ }).click()
  await page.getByRole('button', { name: '09:00 - 09:30' }).click()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await expect(page.getByLabel('Имя')).toHaveValue('Гость')
  await expect(page.getByLabel('Почта')).toHaveValue('guest@example.com')
})
