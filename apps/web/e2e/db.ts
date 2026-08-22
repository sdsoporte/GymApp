const FORBIDDEN_HOSTS = ['elautomata.com', 'nodo-a'];

export function assertE2E(): string {
  if (process.env.E2E !== 'true') {
    throw new Error('E2E=true is required to run E2E tests');
  }

  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL is required to run E2E tests');
  }

  if (process.env.DATABASE_URL && process.env.DATABASE_URL !== databaseUrl) {
    throw new Error('DATABASE_URL cannot be used as a fallback for E2E; unset it or set it equal to TEST_DATABASE_URL');
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error(`TEST_DATABASE_URL is not a valid URL: ${databaseUrl}`);
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error(`TEST_DATABASE_URL protocol must be postgresql: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    throw new Error(`TEST_DATABASE_URL host must be localhost or 127.0.0.1: ${hostname}`);
  }

  for (const forbidden of FORBIDDEN_HOSTS) {
    if (hostname.includes(forbidden)) {
      throw new Error(`TEST_DATABASE_URL must not reference a production host: ${forbidden}`);
    }
  }

  const port = parsed.port || '5432';
  if (port !== '5433') {
    throw new Error(`TEST_DATABASE_URL port must be 5433: ${port}`);
  }

  const databaseName = parsed.pathname.replace(/^\/+/, '');
  if (!databaseName || !databaseName.endsWith('_e2e')) {
    throw new Error(`TEST_DATABASE_URL database name must end with _e2e: ${databaseName}`);
  }

  return databaseUrl;
}

export async function resetMutableTables(databaseUrl: string): Promise<void> {
  process.env.DATABASE_URL = databaseUrl;
  const { db, sql } = await import('@gymapp/db');

  await db.execute(sql`
    TRUNCATE TABLE
      body_metrics,
      session_sets,
      workout_sessions,
      routine_exercises,
      routines
    RESTART IDENTITY CASCADE;
  `);
}
