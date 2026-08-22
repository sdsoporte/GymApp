import { test as base } from '@playwright/test';
import { assertE2E, resetMutableTables } from './db.js';

const databaseUrl = assertE2E();

export const test = base.extend<{ resetMutable: void }>({
  resetMutable: [
    async ({}, use) => {
      await resetMutableTables(databaseUrl);
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
