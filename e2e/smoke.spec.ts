import { expect, test } from '@playwright/test';

test('renders the movement without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/calibers/eta-2824-2');
  await expect(page.locator('canvas')).toBeVisible();
  // No specific condition to wait on here: give async errors (texture/material setup, first few render frames) a
  // real window of wall-clock time to surface before we check for them.
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/smoke.png' });
  expect(errors).toEqual([]);
});
