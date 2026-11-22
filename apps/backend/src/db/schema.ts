import { integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core'

export const meetingTypes = pgTable('meeting_types', {
  id: varchar('id', { length: 9 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 1000 }).notNull(),
  duration: integer('duration').notNull(),
  position: serial('position').notNull().unique(),
})
