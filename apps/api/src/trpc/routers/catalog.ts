import { z } from 'zod';
import { and, count, eq, ilike, or } from 'drizzle-orm';
import { exercises } from '@gymapp/db/schema';
import { publicProcedure, router } from '../trpc.js';

const listInput = z.object({
  q: z.string().optional(),
  bodyPart: z.string().optional(),
  muscleGroup: z.string().optional(),
  equipment: z.string().optional(),
  target: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const detailInput = z.object({
  slug: z.string().optional(),
  externalId: z.string().optional(),
}).refine((data) => Boolean(data.slug || data.externalId), {
  message: 'slug or externalId is required',
});

function withFilters(input: z.infer<typeof listInput>) {
  const filters = [];
  if (input.q) {
    const term = `%${input.q}%`;
    filters.push(
      or(
        ilike(exercises.name, term),
        ilike(exercises.nameEs, term),
        ilike(exercises.bodyPart, term),
        ilike(exercises.equipment, term),
        ilike(exercises.muscleGroup, term),
        ilike(exercises.target, term)
      )
    );
  }
  if (input.bodyPart) filters.push(eq(exercises.bodyPart, input.bodyPart));
  if (input.muscleGroup) filters.push(eq(exercises.muscleGroup, input.muscleGroup));
  if (input.equipment) filters.push(eq(exercises.equipment, input.equipment));
  if (input.target) filters.push(eq(exercises.target, input.target));
  return filters.length ? and(...filters) : undefined;
}

export const catalogRouter = router({
  list: publicProcedure
    .input(listInput)
    .query(async ({ ctx, input }) => {
      const where = withFilters(input);
      const [totalRes, items] = await Promise.all([
        ctx.db.select({ count: count() }).from(exercises).where(where),
        ctx.db
          .select({
            id: exercises.id,
            externalId: exercises.externalId,
            slug: exercises.slug,
            name: exercises.name,
            nameEs: exercises.nameEs,
            bodyPart: exercises.bodyPart,
            muscleGroup: exercises.muscleGroup,
            equipment: exercises.equipment,
            target: exercises.target,
            imageUrl: exercises.imageUrl,
            gifUrl: exercises.gifUrl,
          })
          .from(exercises)
          .where(where)
          .limit(input.limit)
          .offset(input.offset),
      ]);
      return { total: totalRes[0]?.count ?? 0, items };
    }),

  detail: publicProcedure
    .input(detailInput)
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.slug) conditions.push(eq(exercises.slug, input.slug));
      if (input.externalId) conditions.push(eq(exercises.externalId, input.externalId));
      const [item] = await ctx.db
        .select({
          id: exercises.id,
          externalId: exercises.externalId,
          slug: exercises.slug,
          name: exercises.name,
          nameEs: exercises.nameEs,
          bodyPart: exercises.bodyPart,
          muscleGroup: exercises.muscleGroup,
          equipment: exercises.equipment,
          target: exercises.target,
          secondaryMuscles: exercises.secondaryMuscles,
          instructionsEs: exercises.instructionsEs,
          imageUrl: exercises.imageUrl,
          gifUrl: exercises.gifUrl,
          attribution: exercises.attribution,
        })
        .from(exercises)
        .where(conditions.length ? or(...conditions) : undefined)
        .limit(1);
      if (!item) return null;
      return item;
    }),

  facets: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        bodyPart: exercises.bodyPart,
        muscleGroup: exercises.muscleGroup,
        equipment: exercises.equipment,
        target: exercises.target,
      })
      .from(exercises);
    const distinct = (key: keyof typeof rows[number]) =>
      [...new Set(rows.map((r) => r[key]).filter((v): v is string => v !== null && v !== undefined))].sort((a, b) => a.localeCompare(b));
    return {
      bodyParts: distinct('bodyPart'),
      muscleGroups: distinct('muscleGroup'),
      equipment: distinct('equipment'),
      targets: distinct('target'),
    };
  }),
});
