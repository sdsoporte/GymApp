import { index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const bodyMetrics = pgTable(
  'body_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    measuredAt: timestamp('measured_at', { withTimezone: true }).notNull().defaultNow(),
    weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),
    bodyFatPercent: numeric('body_fat_percent', { precision: 4, scale: 1 }),
    waistCm: numeric('waist_cm', { precision: 5, scale: 1 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('body_metrics_measured_at_idx').on(table.measuredAt)]
);
