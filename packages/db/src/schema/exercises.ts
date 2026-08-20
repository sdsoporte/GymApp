import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    externalId: text('external_id').notNull().unique(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    nameEs: text('name_es'),
    category: text('category'),
    equipment: text('equipment'),
    bodyPart: text('body_part'),
    target: text('target'),
    muscleGroup: text('muscle_group'),
    secondaryMuscles: text('secondary_muscles').array(),
    instructionsEs: text('instructions_es'),
    imageUrl: text('image_url'),
    gifUrl: text('gif_url'),
    attribution: text('attribution'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('exercises_body_part_equipment_target_idx').on(table.bodyPart, table.equipment, table.target)]
);
