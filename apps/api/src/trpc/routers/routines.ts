import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { and, count, desc, eq } from 'drizzle-orm';
import { exercises, routineExercises, routines } from '@gymapp/db/schema';
import { publicProcedure, router } from '../trpc.js';

const exerciseInput = z.object({
  exerciseId: z.string().uuid(),
  orderIndex: z.number().int().min(0),
  targetSets: z.number().int().min(1).optional(),
  targetRepsMin: z.number().int().min(1).optional(),
  targetRepsMax: z.number().int().min(1).optional(),
  restSeconds: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
});

const routineFields = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500).optional(),
  active: z.boolean().default(true),
});

function notFound() {
  throw new TRPCError({ code: 'NOT_FOUND', message: 'Routine not found' });
}

async function routineWithExercises(db: typeof import('@gymapp/db').db, routineId: string) {
  const [routine] = await db.select().from(routines).where(eq(routines.id, routineId));
  if (!routine) return null;
  const items = await db
    .select({
      id: routineExercises.id,
      exerciseId: routineExercises.exerciseId,
      orderIndex: routineExercises.orderIndex,
      targetSets: routineExercises.targetSets,
      targetRepsMin: routineExercises.targetRepsMin,
      targetRepsMax: routineExercises.targetRepsMax,
      restSeconds: routineExercises.restSeconds,
      notes: routineExercises.notes,
      name: exercises.name,
      nameEs: exercises.nameEs,
      gifUrl: exercises.gifUrl,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(eq(routineExercises.routineId, routineId))
    .orderBy(routineExercises.orderIndex);
  return { ...routine, exercises: items };
}

export const routinesRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(routines).orderBy(desc(routines.createdAt));
    const totals = await ctx.db
      .select({ routineId: routineExercises.routineId, count: count() })
      .from(routineExercises)
      .groupBy(routineExercises.routineId);
    const map = new Map(totals.map((t) => [t.routineId, t.count]));
    return rows.map((r) => ({ ...r, exerciseCount: map.get(r.id) ?? 0 }));
  }),

  byId: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const routine = await routineWithExercises(ctx.db, input.id);
    if (!routine) notFound();
    return routine;
  }),

  create: publicProcedure
    .input(routineFields.extend({ exercises: z.array(exerciseInput).min(1, 'routine must have at least one exercise') }))
    .mutation(async ({ ctx, input }) => {
      const [routine] = await ctx.db.transaction(async (tx) => {
        const [r] = await tx.insert(routines).values({ name: input.name, description: input.description, active: input.active }).returning();
        await tx.insert(routineExercises).values(
          input.exercises.map((e) => ({
            routineId: r.id,
            exerciseId: e.exerciseId,
            orderIndex: e.orderIndex,
            targetSets: e.targetSets,
            targetRepsMin: e.targetRepsMin,
            targetRepsMax: e.targetRepsMax,
            restSeconds: e.restSeconds,
            notes: e.notes,
          }))
        );
        return [r];
      });
      const result = await routineWithExercises(ctx.db, routine.id);
      if (!result) notFound();
      return result;
    }),

  update: publicProcedure
    .input(z.object({ id: z.string().uuid(), ...routineFields.partial().shape, exercises: z.array(exerciseInput).min(1).optional() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        const [existing] = await tx.select().from(routines).where(eq(routines.id, input.id));
        if (!existing) notFound();
        const updates: Partial<typeof routines.$inferInsert> = { updatedAt: new Date() };
        if (input.name !== undefined) updates.name = input.name;
        if (input.description !== undefined) updates.description = input.description;
        if (input.active !== undefined) updates.active = input.active;
        await tx.update(routines).set(updates).where(eq(routines.id, input.id));
        if (input.exercises) {
          await tx.delete(routineExercises).where(eq(routineExercises.routineId, input.id));
          await tx.insert(routineExercises).values(
            input.exercises.map((e) => ({
              routineId: input.id,
              exerciseId: e.exerciseId,
              orderIndex: e.orderIndex,
              targetSets: e.targetSets,
              targetRepsMin: e.targetRepsMin,
              targetRepsMax: e.targetRepsMax,
              restSeconds: e.restSeconds,
              notes: e.notes,
            }))
          );
        }
      });
      const result = await routineWithExercises(ctx.db, input.id);
      if (!result) notFound();
      return result;
    }),

  delete: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db.select().from(routines).where(eq(routines.id, input.id));
    if (!existing) notFound();
    await ctx.db.delete(routines).where(eq(routines.id, input.id));
    return { id: input.id };
  }),

  addExercise: publicProcedure
    .input(
      z.object({
        routineId: z.string().uuid(),
        exerciseId: z.string().uuid(),
        targetSets: z.number().int().min(1).optional(),
        targetRepsMin: z.number().int().min(1).optional(),
        targetRepsMax: z.number().int().min(1).optional(),
        restSeconds: z.number().int().min(0).optional(),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(routines).where(eq(routines.id, input.routineId));
      if (!existing) notFound();
      const [{ n }] = await ctx.db.select({ n: count() }).from(routineExercises).where(eq(routineExercises.routineId, input.routineId));
      await ctx.db.insert(routineExercises).values({
        routineId: input.routineId,
        exerciseId: input.exerciseId,
        orderIndex: n,
        targetSets: input.targetSets,
        targetRepsMin: input.targetRepsMin,
        targetRepsMax: input.targetRepsMax,
        restSeconds: input.restSeconds,
        notes: input.notes,
      });
      const result = await routineWithExercises(ctx.db, input.routineId);
      if (!result) notFound();
      return result;
    }),

  updateExercise: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        targetSets: z.number().int().min(1).optional(),
        targetRepsMin: z.number().int().min(1).optional(),
        targetRepsMax: z.number().int().min(1).optional(),
        restSeconds: z.number().int().min(0).optional(),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(routineExercises).where(eq(routineExercises.id, input.id));
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Exercise not found in routine' });
      await ctx.db
        .update(routineExercises)
        .set({
          targetSets: input.targetSets,
          targetRepsMin: input.targetRepsMin,
          targetRepsMax: input.targetRepsMax,
          restSeconds: input.restSeconds,
          notes: input.notes,
        })
        .where(eq(routineExercises.id, input.id));
      return routineWithExercises(ctx.db, existing.routineId);
    }),

  removeExercise: publicProcedure
    .input(z.object({ id: z.string().uuid(), routineId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        await tx.delete(routineExercises).where(and(eq(routineExercises.id, input.id), eq(routineExercises.routineId, input.routineId)));
        const rows = await tx.select({ id: routineExercises.id }).from(routineExercises).where(eq(routineExercises.routineId, input.routineId)).orderBy(routineExercises.orderIndex);
        for (let i = 0; i < rows.length; i++) {
          await tx.update(routineExercises).set({ orderIndex: i }).where(eq(routineExercises.id, rows[i].id));
        }
      });
      const result = await routineWithExercises(ctx.db, input.routineId);
      if (!result) notFound();
      return result;
    }),

  reorderExercises: publicProcedure
    .input(z.object({ routineId: z.string().uuid(), exerciseIds: z.array(z.string().uuid()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        for (let i = 0; i < input.exerciseIds.length; i++) {
          await tx
            .update(routineExercises)
            .set({ orderIndex: i })
            .where(and(eq(routineExercises.routineId, input.routineId), eq(routineExercises.exerciseId, input.exerciseIds[i])));
        }
      });
      const result = await routineWithExercises(ctx.db, input.routineId);
      if (!result) notFound();
      return result;
    }),
});
