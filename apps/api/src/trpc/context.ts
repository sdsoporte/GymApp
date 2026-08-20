import { db } from '@gymapp/db';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

export async function createContext({ req }: FetchCreateContextFnOptions) {
  return {
    db,
    req,
    assetsUrl: process.env.ASSETS_URL || 'http://localhost:5174/exercises',
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
