import { expect, test } from '@playwright/test';
import { angle, collectErrors, ready, state } from './helpers';

const TAU = Math.PI * 2;

test('the FS01 chime pusher toggles the strike and steps the column wheel @quick', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/calibers/cw-fs01?lang=en&ch=chime&part=column-wheel');
  await ready(page);
  await expect(page.locator('.info h1')).toHaveText('Column wheel');
  await expect(page.locator('.info .stats')).toContainText('Chiming');
  const wheel = await angle(page, 'column-wheel');
  await page.locator('.info .chime-ctl .toggle').click();
  await expect(page.locator('.info .stats')).toContainText('Silent');
  expect((await state(page)).pushes.chime).toBe(1);
  await expect.poll(() => angle(page, 'column-wheel')).toBeCloseTo(wheel + TAU / 6, 3);
  await page.locator('.info .chime-ctl .toggle').click();
  await expect(page.locator('.info .stats')).toContainText('Chiming');
  expect(errors).toEqual([]);
});

test('the FS01 strike lever climbs at the chime chapter\'s speed', async ({ page }) => {
  await page.goto('/calibers/cw-fs01?lang=en&ch=chime&part=strike-lever');
  await ready(page);
  const a0 = await angle(page, 'strike-lever');
  // At 120× a wall second is two minutes: the lever rises lift / 30 ≈ 0.006 rad.
  await expect.poll(() => angle(page, 'strike-lever'), { timeout: 5_000 }).not.toBeCloseTo(a0, 3);
});
