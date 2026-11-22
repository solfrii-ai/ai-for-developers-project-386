import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'

export const meetingTypes = pgTable('meeting_types', {
  id: varchar('id', { length: 9 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 1000 }).notNull(),
  duration: integer('duration').notNull(),
  position: serial('position').notNull().unique(),
})

export const meetings = pgTable('meetings', {
  id: serial('id').primaryKey(),
  meetingTypeId: varchar('meeting_type_id', { length: 9 }).notNull().references(() => meetingTypes.id),
  startAt: timestamp('start_at', { withTimezone: true, mode: 'date' }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true, mode: 'date' }).notNull(),
  guestName: varchar('guest_name', { length: 100 }).notNull(),
  guestEmail: varchar('guest_email', { length: 254 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
})
