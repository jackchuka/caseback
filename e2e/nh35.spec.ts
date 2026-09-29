import { expect, test, type Page } from '@playwright/test';
import { angle, collectErrors, openTour, ready, state } from './helpers';

// Samples an angle every animation frame for `ms` of wall-clock time: the rotor swings in real time.
const sample = (page: Page, id: string, ms: number) =>
  page.evaluate(
    async ([i, t]) => {
      const out: number[] = [];
      const end = performance.now() + (t as number);
      while (performance.now() < end) {
        out.push(window.__caseback!.angle(i as string));
        await new Promise((r) => requestAnimationFrame(r));
      }
      return out;
    },
    [id, ms],
  );

test('the NH35A caliber page walks the going train @quick', async ({ page }) => {
  const errors = collectErrors(page);
  await openTour(page, 'seiko-nh35a');
  const titles = ['From power to time', 'Barrel', 'Center wheel', 'Third wheel', 'Fourth wheel', 'Escape wheel', 'Pallet fork', 'Balance wheel'];
  for (const [i, title] of titles.entries()) {
    await expect(page.locator('.info h1')).toHaveText(title);
    if (i < titles.length - 1) await page.locator('button.next').click();
  }
  await expect(page).toHaveURL(/calibers\/seiko-nh35a\?.*ch=time&part=balance/);
  expect(errors).toEqual([]);
});

test('the NH35A beats 6 times a second and the fourth wheel carries the seconds on the centre', async ({ page }) => {
  await page.goto('/calibers/seiko-nh35a?lang=en&ch=time&part=fourth');
  await expect(page.locator('.info h1')).toHaveText('Fourth wheel');
  await expect(page.locator('.info .stats')).toContainText('1 rpm');
  await page.goto('/calibers/seiko-nh35a?lang=en&ch=time&part=balance');
  await expect(page.locator('.info p')).toContainText('6 times a second');
  await expect(page.locator('.info .stats')).toContainText('21,600');
});

test('the Magic Lever winds one way whichever way the rotor swings', async ({ page }) => {
  await openTour(page, 'seiko-nh35a');
  await page.getByRole('button', { name: 'Self-winding' }).click();
  await expect(page.locator('.info h1')).toHaveText('Oscillating weight');
  await page.locator('button.next').click();
  await expect(page.locator('.info h1')).toHaveText('First reduction wheel');
  await page.locator('button.next').click();
  await expect(page.locator('.info h1')).toHaveText('Pawl lever (Magic Lever)');
  await expect(page.locator('.info .kicker')).toHaveText('2 · Magic Lever');
  // Long enough for the wrist swing to reverse the rotor at least once.
  const [eccentric, wheel, lever] = await Promise.all([sample(page, 'eccentric', 6000), sample(page, 'second-reduction-wheel', 6000), sample(page, 'pawl-lever', 6000)]);
  const steps = (xs: number[]) => xs.slice(1).map((x, i) => x - xs[i]!);
  expect(steps(eccentric).some((d) => d > 1e-4)).toBe(true);
  expect(steps(eccentric).some((d) => d < -1e-4)).toBe(true);
  expect(steps(wheel).every((d) => d >= -1e-9)).toBe(true);
  expect(wheel.at(-1)! - wheel[0]!).toBeGreaterThan(0);
  expect(Math.max(...lever) - Math.min(...lever)).toBeGreaterThan(1e-3);
  const r0 = (await state(page)).reserveH;
  await page.waitForTimeout(1500);
  expect((await state(page)).reserveH).toBeGreaterThan(r0);
});

test('the NH35A crown hacks the balance at position 2 and pulls out 0.4 mm a click', async ({ page }) => {
  await openTour(page, 'seiko-nh35a', 'ja');
  await page.getByRole('button', { name: 'リューズ' }).click();
  await expect(page.locator('.info h1')).toHaveText('巻真');
  await page.getByRole('radio', { name: '2 · 時刻' }).click();
  const b0 = await angle(page, 'balance-wheel');
  await page.waitForTimeout(500);
  expect(await angle(page, 'balance-wheel')).toBeCloseTo(b0, 6);
  const stem = await page.evaluate(() => window.__caseback!.three().scene.getObjectByName('stem')!.position.x);
  await page.getByRole('radio').first().click();
  await expect.poll(() => page.evaluate(() => window.__caseback!.three().scene.getObjectByName('stem')!.position.x)).toBeCloseTo(stem - 0.8, 3);
});

test('the NH35A date chapter turns the date disc', async ({ page }) => {
  await openTour(page, 'seiko-nh35a');
  await page.getByRole('button', { name: 'Turning the date' }).click();
  await expect(page.locator('.info h1')).toHaveText('Date driving wheel');
  await expect(page.locator('.info .badge').first()).toContainText('6,000');
  await page.locator('button.next').click();
  await expect(page.locator('.info h1')).toHaveText('Date disc');
});

test('the NH35A lists the Presage among its watches', async ({ page }) => {
  await page.goto('/calibers/seiko-nh35a/watches?lang=en');
  await expect(page.locator('.caliber-watches .watch')).toHaveCount(1);
  await expect(page.locator('.caliber-watches')).toContainText('Presage Cocktail Time');
});

test('the Presage opens on its dial, shows the date through the window and the movement through the back @quick', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/watches/seiko/presage-srpb43?lang=en');
  await expect(page.locator('.intro .eyebrow')).toContainText('Seiko 4R35');
  await ready(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/watch-presage-intro.png' });
  const [x, y] = await page.evaluate(() => window.__caseback!.project('minute-wheel'));
  const front = (await page.evaluate(([px, py]) => window.__caseback!.hits(px!, py!), [x, y])).filter((n) => !/hand/.test(n));
  expect(front.slice(0, 2)).toEqual(['crystal', 'dial']);
  await page.locator('.intro button').click();
  await expect.poll(() => page.evaluate(() => window.__caseback!.state().mode), { timeout: 45_000 }).toBe('tour');
  expect(errors).toEqual([]);
});

test('the Presage\'s display back shows the movement @quick', async ({ page }) => {
  await page.goto('/watches/seiko/presage-srpb43?lang=en');
  await ready(page);
  // The watch turns over to its back before the caseback unscrews; probe once the turn has settled.
  await page.locator('.intro button').click();
  await page.evaluate(async () => {
    const h = window.__caseback!;
    const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
    for (let i = 0; i < 15 && h.enabled(); i++) await frame();
    const end = performance.now() + 20_000;
    while (!h.enabled() && performance.now() < end) await frame();
  });
  const [x, y] = await page.evaluate(() => window.__caseback!.project('balance'));
  const hits = await page.evaluate(([px, py]) => window.__caseback!.hits(px!, py!), [x, y]);
  expect(hits[0]).toBe('caseback-glass');
});

test('screenshots every NH35A tour chapter', async ({ page }) => {
  await openTour(page, 'seiko-nh35a');
  for (const chapter of ['Keeping time', 'Moving the hands', 'Turning the date', 'Self-winding', 'Crown']) {
    await page.getByRole('button', { name: chapter, exact: true }).click();
    const steps = await page.locator('.tourbar .steps li').count();
    for (let i = 0; i < steps; i++) {
      if (i > 0) await page.locator('button.next').click();
      await page.waitForTimeout(2600);
      const s = await state(page);
      await page.screenshot({ path: `test-results/nh35/${String(s.stepIndex).padStart(2, '0')}.png` });
    }
  }
});
