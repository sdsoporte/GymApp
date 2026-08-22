import { test, expect } from '@playwright/test';

test.describe('PWA smoke', () => {
  test('built app registers a service worker and serves the manifest', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'GymApp' })).toBeVisible();

    const registration = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false };
      const reg = await navigator.serviceWorker.ready;
      return {
        supported: true,
        active: !!reg.active,
        scope: reg.scope,
      };
    });

    expect(registration.supported, 'Service workers must be supported in the browser').toBe(true);
    expect(registration.active, 'Service worker must be active after registration').toBe(true);

    const manifest = await page.request.get('/manifest.webmanifest');
    expect(manifest).toBeOK();
    const body = await manifest.json();
    expect(body.name).toBe('GymApp');
    expect(body.short_name).toBe('GymApp');
    expect(body.display).toBe('standalone');
  });
});
