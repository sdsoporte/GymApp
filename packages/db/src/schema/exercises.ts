import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  nameEs: text('name_es'),
  category: text('category'),
  equipment: text('equipment'),
  bodyPart: text('body_part'),
  target: text('target'),
  secondaryMuscles: text('secondary_muscles').array(),
  instructionsEs: text('instructions_es'),
  imageUrl: text('image_url'),
  gifUrl: text('gif_url'),
  attribution: text('attribution'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
