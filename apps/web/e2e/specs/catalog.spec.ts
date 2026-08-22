import { test, expect } from '@playwright/test';
import { testIds, labels } from '../selectors.js';

test.describe('catalog', () => {
  test('searches and opens exercise detail', async ({ page }) => {
    await page.goto('/catalog');

    await expect(page.getByRole('heading', { name: labels.catalogHeading })).toBeVisible();
    await page.getByPlaceholder(labels.searchPlaceholder).fill('barbell bench press');

    const result = page.getByTestId(testIds.catalogResult).filter({ hasText: /bench press/i }).first();
    await expect(result).toBeVisible();
    await result.click();

    await expect(page.getByRole('heading', { name: /bench press/i }).first()).toBeVisible();
    await expect(page.getByText('barbell', { exact: false }).first()).toBeVisible();
    await expect(page.getByText(labels.instructionsHeading)).toBeVisible();
  });
});
