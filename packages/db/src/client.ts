import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema/index.js';

let dbInstance: ReturnType<typeof drizzle> | null = null;
let clientInstance: ReturnType<typeof postgres> | null = null;

function getClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  if (!clientInstance) {
    clientInstance = postgres(process.env.DATABASE_URL, {
      max: 5,
      prepare: false,
    });
  }
  return clientInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    if (!dbInstance) {
      dbInstance = drizzle(getClient(), { schema });
    }
    return dbInstance[prop as keyof typeof dbInstance];
  },
});

export { sql };
