const minute = 60_000
const openMinutes = 9 * 60
const closeMinutes = 18 * 60

export type AvailabilitySlot = {
  start: string
  end: string
}

export type AvailabilityDay = {
  date: string
  freeCount: number
}

export type Availability = {
  days: AvailabilityDay[]
  slots: AvailabilitySlot[]
}

function utcDay(now: Date, offset: number) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset))
}

function formatDate(date: Date) {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dayOfMonth = String(date.getUTCDate()).padStart(2, '0')
  return `${date.getUTCFullYear()}-${month}-${dayOfMonth}`
}

export function availabilityFor(durationMinutes: number, now: Date): Availability {
  const days: AvailabilityDay[] = []
  const slots: AvailabilitySlot[] = []

  for (let offset = 0; offset < 14; offset += 1) {
    const date = utcDay(now, offset)
    const weekday = date.getUTCDay()
    let freeCount = 0

    if (weekday >= 1 && weekday <= 5) {
      for (let startMinutes = openMinutes; startMinutes + durationMinutes <= closeMinutes; startMinutes += durationMinutes) {
        const start = new Date(date.getTime() + startMinutes * minute)
        if (start.getTime() < now.getTime()) {
          continue
        }
        const end = new Date(start.getTime() + durationMinutes * minute)
        slots.push({ start: start.toISOString(), end: end.toISOString() })
        freeCount += 1
      }
    }

    days.push({ date: formatDate(date), freeCount })
  }

  return { days, slots }
}
