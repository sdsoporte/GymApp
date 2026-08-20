import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { db } from './client.js';
import { exercises } from './schema/exercises.js';

interface DatasetExercise {
  id: string;
  name: string;
  category?: string | null;
  body_part?: string | null;
  equipment?: string | null;
  target?: string | null;
  secondary_muscles?: string[] | null;
  muscle_group?: string | null;
  instructions?: Record<string, string> | null;
  instruction_steps?: Record<string, string[]> | null;
  image?: string | null;
  gif_url?: string | null;
  attribution?: string | null;
}

function kebab(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function slugify(externalId: string, name: string): string {
  return `${externalId}-${kebab(name)}`.slice(0, 255);
}

async function loadExercises(): Promise<DatasetExercise[]> {
  const repoRoot = path.resolve(import.meta.dirname, '../../..');
  const filePath = path.join(repoRoot, 'assets/exercises/data/exercises.json');
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as DatasetExercise[];
}

function toArray(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return null;
}

function toString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return null;
  return String(value);
}

function mapExercise(item: DatasetExercise) {
  const externalId = toString(item.id);
  const name = toString(item.name);
  if (!externalId || !name) {
    throw new Error(`Invalid exercise: missing id or name: ${JSON.stringify(item)}`);
  }

  const instructionsEs =
    item.instructions?.es ?? item.instruction_steps?.es?.join('\n') ?? null;

  return {
    externalId,
    slug: slugify(externalId, name),
    name,
    category: toString(item.category),
    equipment: toString(item.equipment),
    bodyPart: toString(item.body_part),
    target: toString(item.target),
    muscleGroup: toString(item.muscle_group),
    secondaryMuscles: toArray(item.secondary_muscles),
    instructionsEs,
    imageUrl: toString(item.image),
    gifUrl: toString(item.gif_url),
    attribution: toString(item.attribution),
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function seed() {
  const rows = await loadExercises();
  console.log(`Loaded ${rows.length} exercises from dataset`);

  const values = rows.map(mapExercise);
  const batches = chunk(values, 200);

  for (const [index, batch] of batches.entries()) {
    await db
      .insert(exercises)
      .values(batch)
      .onConflictDoNothing({ target: exercises.externalId });
    console.log(`Inserted batch ${index + 1}/${batches.length} (${batch.length} rows)`);
  }

  console.log('Seed complete.');
}

seed()
  .then(() => {
    console.log('Seed complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
