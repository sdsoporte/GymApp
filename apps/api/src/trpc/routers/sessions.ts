import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { and, asc, count, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import { exercises, routineExercises, routines, sessionSets, workoutSessions } from '@gymapp/db/schema';
import { publicProcedure, router } from '../trpc.js';

const setInput = z.object({
  sessionId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(0).optional(),
  weightKg: z.number().min(0).optional(),
  rpe: z.number().min(0).max(10).optional(),
  restSeconds: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
});

function conflict(message: string) {
  throw new TRPCError({ code: 'CONFLICT', message });
}

function notFound(message: string) {
  throw new TRPCError({ code: 'NOT_FOUND', message });
}

async function sessionWithSets(db: typeof import('@gymapp/db').db, sessionId: string) {
  const [session] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, sessionId));
  if (!session) return null;

  const sets = await db
    .select({
      id: sessionSets.id,
      exerciseId: sessionSets.exerciseId,
      setNumber: sessionSets.setNumber,
      reps: sessionSets.reps,
      weightKg: sessionSets.weightKg,
      rpe: sessionSets.rpe,
      restSeconds: sessionSets.restSeconds,
      loggedAt: sessionSets.loggedAt,
      notes: sessionSets.notes,
      name: exercises.name,
      nameEs: exercises.nameEs,
      gifUrl: exercises.gifUrl,
    })
    .from(sessionSets)
    .innerJoin(exercises, eq(sessionSets.exerciseId, exercises.id))
    .where(eq(sessionSets.sessionId, sessionId))
    .orderBy(asc(sessionSets.setNumber));

  const exerciseIds = sets.map((s) => s.exerciseId);
  let targets: Array<{
    exerciseId: string;
    name: string | null;
    nameEs: string | null;
    gifUrl: string | null;
    orderIndex: number;
    targetSets: number | null;
    targetRepsMin: number | null;
    targetRepsMax: number | null;
    restSeconds: number | null;
  }> = [];

  if (session.routineId) {
    targets = await db
      .select({
        exerciseId: routineExercises.exerciseId,
        name: exercises.name,
        nameEs: exercises.nameEs,
        gifUrl: exercises.gifUrl,
        orderIndex: routineExercises.orderIndex,
        targetSets: routineExercises.targetSets,
        targetRepsMin: routineExercises.targetRepsMin,
        targetRepsMax: routineExercises.targetRepsMax,
        restSeconds: routineExercises.restSeconds,
      })
      .from(routineExercises)
      .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
      .where(eq(routineExercises.routineId, session.routineId))
      .orderBy(asc(routineExercises.orderIndex));
  }

  const exerciseMap = new Map(targets.map((t) => [t.exerciseId, t]));
  for (const s of sets) {
    if (!exerciseMap.has(s.exerciseId)) {
      exerciseMap.set(s.exerciseId, {
        exerciseId: s.exerciseId,
        name: s.name,
        nameEs: s.nameEs,
        gifUrl: s.gifUrl,
        orderIndex: 9999,
        targetSets: null,
        targetRepsMin: null,
        targetRepsMax: null,
        restSeconds: null,
      });
    }
  }

  const orderedExercises = Array.from(exerciseMap.values()).sort((a, b) => a.orderIndex - b.orderIndex);

  return {
    ...session,
    exercises: orderedExercises.map((ex) => ({
      ...ex,
      sets: sets.filter((s) => s.exerciseId === ex.exerciseId).map((s) => ({
        id: s.id,
        setNumber: s.setNumber,
        reps: s.reps,
        weightKg: s.weightKg,
        rpe: s.rpe,
        restSeconds: s.restSeconds,
        loggedAt: s.loggedAt,
        notes: s.notes,
      })),
    })),
  };
}

async function guardActiveSession(db: typeof import('@gymapp/db').db, sessionId: string) {
  const [session] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, sessionId));
  if (!session) notFound('Session not found');
  if (session.completedAt) conflict('Session already completed');
  return session;
}

export const sessionsRouter = router({
  start: publicProcedure.input(z.object({ routineId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const [routine] = await ctx.db.select().from(routines).where(eq(routines.id, input.routineId));
    if (!routine) notFound('Routine not found');

    const [session] = await ctx.db
      .insert(workoutSessions)
      .values({ routineId: input.routineId })
      .returning();

    return sessionWithSets(ctx.db, session.id);
  }),

  byId: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const result = await sessionWithSets(ctx.db, input.id);
    if (!result) notFound('Session not found');
    return result;
  }),

  current: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(workoutSessions)
      .where(isNull(workoutSessions.completedAt))
      .orderBy(workoutSessions.startedAt)
      .limit(1);

    if (!rows.length) return null;
    return sessionWithSets(ctx.db, rows[0].id);
  }),

  logSet: publicProcedure.input(setInput).mutation(async ({ ctx, input }) => {
    await guardActiveSession(ctx.db, input.sessionId);

    const existing = await ctx.db
      .select({ id: sessionSets.id })
      .from(sessionSets)
      .where(
        and(
          eq(sessionSets.sessionId, input.sessionId),
          eq(sessionSets.exerciseId, input.exerciseId),
          eq(sessionSets.setNumber, input.setNumber)
        )
      )
      .limit(1);

    if (existing.length) {
      await ctx.db
        .update(sessionSets)
        .set({
          reps: input.reps ?? null,
          weightKg: input.weightKg === undefined ? null : String(input.weightKg),
          rpe: input.rpe === undefined ? null : String(input.rpe),
          restSeconds: input.restSeconds ?? null,
          notes: input.notes ?? null,
          loggedAt: new Date(),
        })
        .where(eq(sessionSets.id, existing[0].id));
      return sessionWithSets(ctx.db, input.sessionId);
    }

    await ctx.db.insert(sessionSets).values({
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setNumber: input.setNumber,
      reps: input.reps ?? null,
      weightKg: input.weightKg === undefined ? null : String(input.weightKg),
      rpe: input.rpe === undefined ? null : String(input.rpe),
      restSeconds: input.restSeconds ?? null,
      notes: input.notes ?? null,
    });

    return sessionWithSets(ctx.db, input.sessionId);
  }),

  deleteSet: publicProcedure.input(z.object({ sessionId: z.string().uuid(), id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    await guardActiveSession(ctx.db, input.sessionId);
    await ctx.db
      .delete(sessionSets)
      .where(and(eq(sessionSets.id, input.id), eq(sessionSets.sessionId, input.sessionId)));
    return sessionWithSets(ctx.db, input.sessionId);
  }),

  complete: publicProcedure.input(z.object({ id: z.string().uuid(), notes: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    const session = await guardActiveSession(ctx.db, input.id);
    if (session.completedAt) conflict('Session already completed');

    await ctx.db
      .update(workoutSessions)
      .set({ completedAt: new Date(), notes: input.notes ?? session.notes })
      .where(eq(workoutSessions.id, input.id));

    return sessionWithSets(ctx.db, input.id);
  }),

  history: publicProcedure
    .input(
      z.object({
        limit: z.coerce.number().int().min(1).max(100).default(20),
        offset: z.coerce.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = isNotNull(workoutSessions.completedAt);

      const [totalRes, rows] = await Promise.all([
        ctx.db.select({ count: count() }).from(workoutSessions).where(where),
        ctx.db
          .select({
            id: workoutSessions.id,
            startedAt: workoutSessions.startedAt,
            completedAt: workoutSessions.completedAt,
            durationMinutes: sql<number>`ceil(extract(epoch from (${workoutSessions.completedAt} - ${workoutSessions.startedAt})) / 60)`,
            routineName: routines.name,
            totalSets: count(sessionSets.id),
          })
          .from(workoutSessions)
          .leftJoin(routines, eq(workoutSessions.routineId, routines.id))
          .leftJoin(sessionSets, eq(sessionSets.sessionId, workoutSessions.id))
          .where(where)
          .groupBy(workoutSessions.id, routines.name)
          .orderBy(desc(workoutSessions.completedAt))
          .limit(input.limit)
          .offset(input.offset),
      ]);

      return {
        total: totalRes[0]?.count ?? 0,
        items: rows,
      };
    }),
});
