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

test('toggling tour and free mode many times keeps the webgl context', async ({ page }) => {
  const lost: string[] = [];
  page.on('console', (m) => {
    if (/Context Lost|Too many active WebGL/.test(m.text())) lost.push(m.text());
  });
  await openTour(page);
  for (let i = 0; i < 30; i++) {
    await page.locator('button.to-free').click();
    await page.locator('.dock button.to-tour').click();
  }
  await page.waitForTimeout(1000);
  expect(lost).toEqual([]);
});

test('clicking the focused gear during an x-ray step stays in the tour', async ({ page }) => {
  await openTour(page);
  for (let i = 0; i < 3; i++) await page.locator('button.next').click();
  await page.waitForTimeout(2500);
  const [x, y] = await page.evaluate(() => window.__caseback!.project('third'));
  await page.mouse.click(x, y);
  await page.waitForTimeout(300);
  expect(await state(page)).toMatchObject({ mode: 'tour', stepIndex: 3 });
});

test('tablet layout keeps the tour controls on screen', async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1112 });
  await page.goto('/?lang=en');
  await ready(page);
  await page.getByRole('button', { name: 'Open the caseback' }).click();
  await expect.poll(async () => (await state(page)).mode, { timeout: 45_000 }).toBe('tour');
  const prev = await page.locator('button.prev').boundingBox();
  const free = await page.locator('button.to-free').boundingBox();
  expect(prev!.x).toBeGreaterThanOrEqual(0);
  expect(free!.x + free!.width).toBeLessThanOrEqual(834);
});

test('the hint never overlaps the tour bar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openTour(page);
  const hint = await page.locator('.hint').boundingBox();
  const bar = await page.locator('.tourbar').boundingBox();
  if (hint) expect(hint.x + hint.width <= bar!.x || hint.y + hint.height <= bar!.y).toBe(true);
});

test('the info panel shows sources and estimate notes', async ({ page }) => {
  await openTour(page);
  for (let i = 0; i < 4; i++) await page.locator('button.next').click();
  await expect(page.locator('.info h1')).toHaveText('四番車');
  await page.locator('.info details.sources summary').click();
  await expect(page.locator('.info details.sources')).toContainText('FIRGELLI');
  await expect(page.locator('.info details.sources')).toContainText('84 teeth');
});

test('dial chapters flip the movement and fast-forward', async ({ page }) => {
  await openTour(page);
  await page.getByRole('button', { name: '針を動かす' }).click();
  await expect(page.locator('.info h1')).toHaveText('文字盤の下へ');
  await expect.poll(() => page.evaluate(() => window.__caseback!.flip()), { timeout: 10_000 }).toBeCloseTo(Math.PI, 2);
  await expect(page.locator('.info .badge').first()).toContainText('60');
  await page.getByRole('button', { name: '日付を送る' }).click();
  await expect(page.locator('.info h1')).toHaveText('日回し車');
});

test('flips back to the bridge side', async ({ page }) => {
  await openTour(page);
  await page.getByRole('button', { name: '針を動かす' }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: '時を刻む' }).click();
  await expect.poll(() => page.evaluate(() => window.__caseback!.flip()), { timeout: 10_000 }).toBeCloseTo(0, 3);
});

test('free mode flip shows dial parts', async ({ page }) => {
  await openTour(page);
  await page.locator('button.to-free').click();
  await page.locator('.dock button.flip').click();
  await expect.poll(() => page.evaluate(() => window.__caseback!.flip()), { timeout: 10_000 }).toBeCloseTo(Math.PI, 2);
  await page.mouse.click(700, 450);
  await expect.poll(() => page.evaluate(() => window.__caseback!.state().selected)).not.toBeNull();
  const selected = await page.evaluate(() => window.__caseback!.state().selected);
  expect(['date-ring', 'hour', 'cannon', 'minute-wheel', 'date-driver', 'plate']).toContain(selected);
});

test('self-winding raises the power reserve', async ({ page }) => {
  await openTour(page);
  await page.getByRole('button', { name: '自動で巻く' }).click();
  await expect(page.locator('.info h1')).toHaveText('ローター');
  const r0 = await page.evaluate(() => window.__caseback!.state().reserveH);
  await page.waitForTimeout(4000);
  const r1 = await page.evaluate(() => window.__caseback!.state().reserveH);
  expect(r1).toBeGreaterThan(r0);
  await expect(page.locator('.info .stats')).toContainText('時間');
});

test('clicking reversers through the rotor stays in the tour', async ({ page }) => {
  await openTour(page);
  await page.getByRole('button', { name: '自動で巻く' }).click();
  await page.locator('button.next').click();
  await page.waitForTimeout(2500);
  const [x, y] = await page.evaluate(() => window.__caseback!.project('reversers'));
  await page.mouse.click(x, y);
  await page.waitForTimeout(300);
  expect(await state(page)).toMatchObject({ mode: 'tour' });
  await expect(page.locator('.info h1')).toHaveText('切替車');
});

test('hidden rotor does not catch clicks in the first chapter', async ({ page }) => {
  await openTour(page);
  await page.waitForTimeout(2000);
  const [x, y] = await page.evaluate(() => window.__caseback!.project('barrel'));
  await page.mouse.click(x, y);
  await page.waitForTimeout(300);
  const s = await page.evaluate(() => {
    const st = window.__caseback!.state();
    return { selected: st.selected, stepIndex: st.stepIndex };
  });
  expect(['rotor', 'reversers', 'reduction']).not.toContain(s.selected);
  expect(s.stepIndex).toBeLessThan(14);
});

test('the rotor stays still while paused', async ({ page }) => {
  await openTour(page);
  await page.getByRole('button', { name: '自動で巻く' }).click();
  await page.waitForTimeout(2000);
  await page.locator('.tourbar').getByRole('button', { name: '一時停止' }).click();
  // The reserve is published every 250 ms; let the last pre-pause value land first.
  await page.waitForTimeout(500);
  const a0 = await page.evaluate(() => window.__caseback!.state().reserveH);
  await page.waitForTimeout(3000);
  expect(await page.evaluate(() => window.__caseback!.state().reserveH)).toBeCloseTo(a0, 3);
});

async function toCrown(page: Page) {
  await openTour(page);
  await page.getByRole('button', { name: 'リューズ' }).click();
  await expect(page.locator('.info h1')).toHaveText('巻真');
}
async function hold(page: Page, ms: number) {
  const b = await page.locator('.crown-ctl .turn').boundingBox();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

test('position 2 sets the hands and stops the train', async ({ page }) => {
  await toCrown(page);
  await page.getByRole('radio', { name: '2 · 時刻' }).click();
  const esc0 = await page.evaluate(() => window.__caseback!.angle('escape-wheel'));
  const min0 = await page.evaluate(() => window.__caseback!.angle('minute-hand'));
  await hold(page, 1000);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__caseback!.angle('escape-wheel'))).toBeCloseTo(esc0, 6);
  expect(Math.abs((await page.evaluate(() => window.__caseback!.angle('minute-hand'))) - min0)).toBeGreaterThan(0.5);
});

test('position 1 advances the date', async ({ page }) => {
  await toCrown(page);
  await page.getByRole('radio', { name: '1 · 日付' }).click();
  const r0 = await page.evaluate(() => window.__caseback!.angle('date-ring'));
  await hold(page, 1500);
  await page.waitForTimeout(500);
  expect(Math.abs((await page.evaluate(() => window.__caseback!.angle('date-ring'))) - r0)).toBeGreaterThan(0.15);
});

test('position 0 winds the mainspring up to the limit', async ({ page }) => {
  await toCrown(page);
  const r0 = await page.evaluate(() => window.__caseback!.state().reserveH);
  await hold(page, 3000);
  await page.waitForTimeout(400);
  const r1 = await page.evaluate(() => window.__caseback!.state().reserveH);
  expect(r1).toBeGreaterThan(r0);
  expect(r1).toBeLessThanOrEqual(38);
});

test('turning stops on pointerup outside the button', async ({ page }) => {
  await toCrown(page);
  const b = await page.locator('.crown-ctl .turn').boundingBox();
  await page.mouse.move(b!.x + 5, b!.y + 5);
  await page.mouse.down();
  await page.mouse.move(10, 10);
  await page.mouse.up();
  expect(await page.evaluate(() => window.__caseback!.state().turning)).toBe(false);
});

test('leaving the crown chapter restarts the balance', async ({ page }) => {
  await toCrown(page);
  await page.getByRole('radio', { name: '2 · 時刻' }).click();
  await page.getByRole('button', { name: '時を刻む' }).click();
  expect(await page.evaluate(() => window.__caseback!.state().crownPos)).toBe(0);
});
