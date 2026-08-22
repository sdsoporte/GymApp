import { index, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { exercises } from './exercises.js';
import { routines } from './routines.js';

export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  routineId: uuid('routine_id').references(() => routines.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessionSets = pgTable('session_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => workoutSessions.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps'),
  weightKg: numeric('weight_kg', { precision: 6, scale: 2 }),
  rpe: numeric('rpe', { precision: 3, scale: 1 }),
  restSeconds: integer('rest_seconds'),
  loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
  notes: text('notes'),
}, (table) => [
  index('session_sets_session_id_exercise_id_idx').on(table.sessionId, table.exerciseId),
]);
