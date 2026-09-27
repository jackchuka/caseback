import { expect, test, type Page } from '@playwright/test';

const target = (page: Page) => page.evaluate(() => window.__caseback!.target());
const state = (page: Page) => page.evaluate(() => {
  const s = window.__caseback!.state();
  return { mode: s.mode, stepIndex: s.stepIndex, lang: s.lang };
});

async function ready(page: Page) {
  await page.waitForFunction(() => window.__caseback !== undefined, null, { timeout: 30_000 });
}

async function openTour(page: Page) {
  await page.goto('/?lang=ja');
  await ready(page);
  await page.getByRole('button', { name: '裏蓋を開ける' }).click();
  await expect.poll(async () => (await state(page)).mode, { timeout: 45_000 }).toBe('tour');
}

test('walks through every step of the chapter', async ({ page }) => {
  await openTour(page);
  const titles = ['動力が時を刻むまで', '香箱', '二番車', '三番車', '四番車', 'ガンギ車', 'アンクル', 'テンプ'];
  for (const [i, title] of titles.entries()) {
    await expect(page.locator('.info h1')).toHaveText(title);
    await expect(page.locator('.tourbar .steps li.on')).toHaveCount(1);
    if (i < titles.length - 1) await page.locator('button.next').click();
  }
  await expect(page).toHaveURL(/ch=time&part=balance/);
});

test('rapid next clicks land on the last step', async ({ page }) => {
  await openTour(page);
  const next = page.locator('button.next');
  await next.click();
  await next.click();
  await next.click();
  await page.waitForTimeout(2500);
  expect((await state(page)).stepIndex).toBe(3);
  await expect(page.locator('.info h1')).toHaveText('三番車');
  const [x, , z] = await target(page);
  // third wheel sits at place(center, 3.825mm, -130°) → world (x, ?, -y)
  expect(x).toBeCloseTo(-2.46, 1);
  expect(z).toBeCloseTo(2.93, 1);
});

test('explore freely recenters the camera and returns to the same step', async ({ page }) => {
  await openTour(page);
  await page.locator('button.next').click();
  await page.locator('button.next').click();
  await page.waitForTimeout(2200);
  await page.locator('button.to-free').click();
  await page.waitForTimeout(2000);
  const [x, y, z] = await target(page);
  expect(Math.hypot(x, y, z)).toBeLessThan(0.01);
  await expect(page.locator('.dock')).not.toHaveClass(/hidden/);
  await page.locator('.dock button.to-tour').click();
  expect((await state(page)).stepIndex).toBe(2);
});

test('language switch keeps the step', async ({ page }) => {
  await openTour(page);
  await page.locator('button.next').click();
  await expect(page.locator('.info h1')).toHaveText('香箱');
  await page.locator('.topbar .lang button[data-lang="en"]').click();
  await expect(page.locator('.info h1')).toHaveText('Barrel');
  expect(await state(page)).toMatchObject({ stepIndex: 1, lang: 'en' });
  await expect(page).toHaveURL(/lang=en/);
});

test('deep links open the requested step and ignore bad input', async ({ page }) => {
  await page.goto('/?lang=en&ch=time&part=escape');
  await expect(page.locator('.info h1')).toHaveText('Escape wheel');
  await page.goto('/calibers/nope?part=ghost');
  await expect(page.getByRole('button', { name: /裏蓋を開ける|Open the caseback/ })).toBeVisible();
});

test('keyboard arrows move through the tour', async ({ page }) => {
  await openTour(page);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  expect((await state(page)).stepIndex).toBe(1);
});

test('mobile layout has no horizontal scroll and shows panel and bar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTour(page);
  await page.locator('button.next').click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const panel = await page.locator('.info').boundingBox();
  const bar = await page.locator('.tourbar').boundingBox();
  expect(panel && bar).toBeTruthy();
  expect(panel!.y + panel!.height).toBeLessThanOrEqual(bar!.y + 1);
});

test('reduced motion skips the opening and starts paused', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/?lang=ja');
  await ready(page);
  expect(await page.evaluate(() => ({ mode: window.__caseback!.state().mode, paused: window.__caseback!.state().paused }))).toEqual({ mode: 'tour', paused: true });
  await ctx.close();
});

test('webgl fallback', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto('/?lang=ja');
  await expect(page.locator('.fallback h1')).toHaveText('3D表示に対応していません');
});

test('theme toggle flips the document theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await openTour(page);
  await page.locator('.topbar .theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
