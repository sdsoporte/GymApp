import { execSync } from 'node:child_process';
import path from 'node:path';
import { assertE2E, resetMutableTables } from './db.js';

async function startCompose() {
  const composeFile = path.resolve(import.meta.dirname, '../../../docker-compose.e2e.yml');
  execSync('docker compose -f "${file}" up -d --wait'.replace('${file}', composeFile), {
    stdio: 'inherit',
  });
}

async function runMigrations(databaseUrl: string) {
  const env = { ...process.env, DATABASE_URL: databaseUrl, E2E: 'true' };
  execSync('pnpm --filter @gymapp/db migrate', {
    stdio: 'inherit',
    env,
  });
}

async function runSeed(databaseUrl: string) {
  const env = { ...process.env, DATABASE_URL: databaseUrl, E2E: 'true' };
  execSync('pnpm --filter @gymapp/db seed', {
    stdio: 'inherit',
    env,
  });
}

export default async function globalSetup() {
  const databaseUrl = assertE2E();
  await startCompose();
  await runMigrations(databaseUrl);
  await runSeed(databaseUrl);
  await resetMutableTables(databaseUrl);
}
