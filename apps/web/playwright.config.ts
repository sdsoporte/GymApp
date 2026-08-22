import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

export default defineConfig({
  testDir: './e2e/specs',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    locale: 'es-AR',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
  globalSetup: path.resolve('./e2e/global-setup.ts'),
  webServer: [
    {
      command: 'pnpm --filter @gymapp/api dev',
      url: 'http://localhost:3000/health',
      reuseExistingServer: false,
      env: {
        E2E: 'true',
        DATABASE_URL: testDatabaseUrl ?? '',
        ASSETS_URL: 'http://localhost:5174/exercises',
        PORT: '3000',
      },
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter @gymapp/web dev',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      env: {
        E2E: 'true',
      },
      timeout: 120_000,
    },
  ],
});
