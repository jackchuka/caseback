import { expect, test, type Page } from '@playwright/test';

const state = (page: Page) => page.evaluate(() => window.__caseback!.state());
const angle = (page: Page, id: string) => page.evaluate((i) => window.__caseback!.angle(i), id);
const TAU = Math.PI * 2;

async function openTour(page: Page, lang: 'en' | 'ja' = 'en') {
  await page.goto(`/calibers/valjoux-7750?lang=${lang}`);
  await page.waitForFunction(() => window.__caseback !== undefined, null, { timeout: 30_000 });
  await page.getByRole('button', { name: lang === 'en' ? 'Open the caseback' : '裏蓋を開ける' }).click();
  await expect.poll(async () => (await state(page)).mode, { timeout: 45_000 }).toBe('tour');
}

test('the 7750 caliber page walks the going train without errors @quick', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openTour(page);
  const titles = ['From power to time', 'Barrel', 'Great wheel', 'Third wheel', 'Fourth wheel', 'Escape wheel', 'Pallet fork', 'Balance wheel'];
  for (const [i, title] of titles.entries()) {
    await expect(page.locator('.info h1')).toHaveText(title);
    if (i < titles.length - 1) await page.locator('button.next').click();
  }
  await expect(page).toHaveURL(/calibers\/valjoux-7750\?.*ch=time&part=balance/);
  await expect(page.locator('.info p')).toContainText('8 times a second');
  expect(errors).toEqual([]);
});

test('the 7750 chronograph starts, stops and resets from its pushers @quick', async ({ page }) => {
  await page.goto('/calibers/valjoux-7750?lang=en&ch=chrono&part=runner');
  await page.waitForFunction(() => window.__caseback !== undefined, null, { timeout: 30_000 });
  await expect(page.locator('.info h1')).toHaveText('Chronograph wheel');
  const start = page.locator('.info .chrono-ctl .start-stop');
  const reset = page.locator('.info .chrono-ctl .reset');
  await expect(page.locator('.info .stats')).toContainText('At zero');
  expect(await angle(page, 'chrono-seconds-hand')).toBe(0);

  await start.click();
  await expect(page.locator('.info .stats')).toContainText('Running');
  // The runner follows the fourth wheel, a quarter turn in 15 s: well over a hundredth of a turn in 1.5 s.
  await expect.poll(() => angle(page, 'chrono-seconds-hand'), { timeout: 5_000 }).toBeGreaterThan(0.01 * TAU);
  // Reset does nothing while running.
  await reset.click();
  expect((await state(page)).chrono).toBe('running');

  await start.click();
  await expect(page.locator('.info .stats')).toContainText('Stopped');
  const held = await angle(page, 'chrono-seconds-hand');
  await page.waitForTimeout(800);
  expect(await angle(page, 'chrono-seconds-hand')).toBeCloseTo(held, 9);
  // The oscillating pinion swings out of the runner when stopped, and the running seconds keep going.
  const s0 = await angle(page, 'seconds-hand');
  await expect.poll(() => angle(page, 'seconds-hand')).not.toBeCloseTo(s0, 6);

  await reset.click();
  await expect(page.locator('.info .stats')).toContainText('At zero');
  await expect.poll(() => angle(page, 'chrono-seconds-hand'), { timeout: 5_000 }).toBe(0);
  expect(await angle(page, 'minute-counter-hand')).toBe(0);
  expect(await angle(page, 'hour-counter-hand')).toBe(0);
});

test('the 7750 minute counter steps once a runner turn and the hour counter creeps', async ({ page }) => {
  await page.goto('/calibers/valjoux-7750?lang=en&ch=chrono&part=minute-counter');
  await page.waitForFunction(() => window.__caseback !== undefined, null, { timeout: 30_000 });
  await expect(page.locator('.info .badge').first()).toContainText('20');
  await page.locator('.info .chrono-ctl .start-stop').click();
  // At 20× a runner turn takes 3 s.
  await expect.poll(() => angle(page, 'minute-counter-hand'), { timeout: 15_000 }).toBeGreaterThan(TAU / 30 - 1e-6);
  const minutes = await angle(page, 'minute-counter-hand');
  const runner = await angle(page, 'chrono-seconds-hand');
  expect(Math.floor(runner / TAU)).toBe(Math.round(minutes / (TAU / 30)));
  expect(await angle(page, 'hour-counter-hand')).toBeGreaterThan(0);
});

test('the 7750 pushers work in free mode too, and the rotor winds one way', async ({ page }) => {
  await openTour(page);
  await page.getByRole('button', { name: 'Self-winding' }).click();
  await expect(page.locator('.info h1')).toHaveText('Oscillating weight');
  const r0 = (await state(page)).reserveH;
  await page.waitForTimeout(3000);
  expect((await state(page)).reserveH).toBeGreaterThan(r0);
  await page.locator('button.to-free').click();
  await page.locator('.dock .chrono-ctl .start-stop').click();
  expect((await state(page)).chrono).toBe('running');
});

test('the 7750 shows the day and the date', async ({ page }) => {
  await page.goto('/calibers/valjoux-7750?lang=en&ch=date&part=day-ring');
  await expect(page.locator('.info h1')).toHaveText('Day disc');
  await expect(page.locator('.info .badge').first()).toContainText('6,000');
});

test('screenshots every 7750 tour chapter', async ({ page }) => {
  await openTour(page);
  for (const chapter of ['Keeping time', 'Moving the hands', 'Day and date', 'Chronograph', 'Self-winding', 'Crown']) {
    await page.getByRole('button', { name: chapter, exact: true }).click();
    if (chapter === 'Chronograph') await page.locator('.info .chrono-ctl .start-stop').click();
    const steps = await page.locator('.tourbar .steps li').count();
    for (let i = 0; i < steps; i++) {
      if (i > 0) await page.locator('button.next').click();
      await page.waitForTimeout(2600);
      const s = await state(page);
      await page.screenshot({ path: `test-results/v7750/${String(s.stepIndex).padStart(2, '0')}.png` });
    }
  }
});
