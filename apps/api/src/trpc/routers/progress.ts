import { z } from 'zod';
import { and, desc, eq, gte, isNotNull, lte, max, sql } from 'drizzle-orm';
import { bodyMetrics, exercises, sessionSets, workoutSessions } from '@gymapp/db/schema';
import { publicProcedure, router } from '../trpc.js';

const listInput = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const metricInput = z.object({
  measuredAt: z.coerce.date(),
  weightKg: z.coerce.number().min(0).max(500).optional(),
  bodyFatPercent: z.coerce.number().min(0).max(100).optional(),
  waistCm: z.coerce.number().min(0).max(300).optional(),
  notes: z.string().max(1000).optional(),
});

export const progressRouter = router({
  exerciseWeight: publicProcedure
    .input(
      z.object({
        exerciseId: z.string().uuid(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const exercise = await ctx.db
        .select({ id: exercises.id, name: exercises.name, nameEs: exercises.nameEs })
        .from(exercises)
        .where(eq(exercises.id, input.exerciseId))
        .limit(1);
      if (!exercise.length) return { exercise: null, data: [] };

      const rows = await ctx.db
        .select({
          sessionId: workoutSessions.id,
          date: workoutSessions.completedAt,
          bestWeightKg: max(sessionSets.weightKg),
        })
        .from(workoutSessions)
        .innerJoin(sessionSets, eq(sessionSets.sessionId, workoutSessions.id))
        .where(
          and(
            eq(sessionSets.exerciseId, input.exerciseId),
            isNotNull(workoutSessions.completedAt),
            isNotNull(sessionSets.weightKg)
          )
        )
        .groupBy(workoutSessions.id, workoutSessions.completedAt)
        .orderBy(desc(workoutSessions.completedAt))
        .limit(input.limit);

      return {
        exercise: exercise[0],
        data: rows.map((r) => ({
          sessionId: r.sessionId,
          date: r.date,
          bestWeightKg: r.bestWeightKg,
        })),
      };
    }),

  bodyMetrics: router({
    list: publicProcedure.input(listInput).query(async ({ ctx, input }) => {
      const [totalRes, rows] = await Promise.all([
        ctx.db.select({ count: sql<number>`count(*)::int` }).from(bodyMetrics),
        ctx.db
          .select()
          .from(bodyMetrics)
          .orderBy(desc(bodyMetrics.measuredAt))
          .limit(input.limit)
          .offset(input.offset),
      ]);

      return {
        total: totalRes[0]?.count ?? 0,
        items: rows,
      };
    }),

    create: publicProcedure.input(metricInput).mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(bodyMetrics)
        .values({
          measuredAt: input.measuredAt,
          weightKg: input.weightKg === undefined ? null : String(input.weightKg),
          bodyFatPercent: input.bodyFatPercent === undefined ? null : String(input.bodyFatPercent),
          waistCm: input.waistCm === undefined ? null : String(input.waistCm),
          notes: input.notes ?? null,
        })
        .returning();
      return row;
    }),

    update: publicProcedure
      .input(z.object({ id: z.string().uuid() }).merge(metricInput.partial()))
      .mutation(async ({ ctx, input }) => {
        const { id, ...values } = input;
        const [row] = await ctx.db
          .update(bodyMetrics)
          .set({
            measuredAt: values.measuredAt,
            weightKg: values.weightKg === undefined ? undefined : values.weightKg === null ? null : String(values.weightKg),
            bodyFatPercent:
              values.bodyFatPercent === undefined
                ? undefined
                : values.bodyFatPercent === null
                  ? null
                  : String(values.bodyFatPercent),
            waistCm: values.waistCm === undefined ? undefined : values.waistCm === null ? null : String(values.waistCm),
            notes: values.notes,
          })
          .where(eq(bodyMetrics.id, id))
          .returning();
        return row ?? null;
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(bodyMetrics).where(eq(bodyMetrics.id, input.id));
        return { id: input.id };
      }),

    history: publicProcedure
      .input(
        z.object({
          from: z.coerce.date().optional(),
          to: z.coerce.date().optional(),
          limit: z.coerce.number().int().min(1).max(100).default(50),
          offset: z.coerce.number().int().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input.from) conditions.push(gte(bodyMetrics.measuredAt, input.from));
        if (input.to) conditions.push(lte(bodyMetrics.measuredAt, input.to));
        const where = conditions.length ? and(...conditions) : undefined;

        const [totalRes, rows] = await Promise.all([
          ctx.db.select({ count: sql<number>`count(*)::int` }).from(bodyMetrics).where(where),
          ctx.db
            .select()
            .from(bodyMetrics)
            .where(where)
            .orderBy(desc(bodyMetrics.measuredAt))
            .limit(input.limit)
            .offset(input.offset),
        ]);

        return {
          total: totalRes[0]?.count ?? 0,
          items: rows,
        };
      }),
  }),
});
