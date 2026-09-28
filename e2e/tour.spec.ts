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
  await page.goto('/calibers/eta-2824-2?lang=ja');
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
  await page.goto('/calibers/eta-2824-2?lang=en&ch=time&part=escape');
  await expect(page.locator('.info h1')).toHaveText('Escape wheel');
  await page.goto('/calibers/nope?part=ghost');
  await expect(page.locator('.home')).toBeAttached();
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
  await page.goto('/calibers/eta-2824-2?lang=ja');
  await ready(page);
  expect(await page.evaluate(() => ({ mode: window.__caseback!.state().mode, paused: window.__caseback!.state().paused }))).toEqual({ mode: 'tour', paused: true });
  await ctx.close();
});

test('webgl fallback', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto('/calibers/eta-2824-2?lang=ja');
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
  await page.goto('/calibers/eta-2824-2?lang=en');
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

test('watch page shows its name and a display caseback shows the movement', async ({ page }) => {
  await page.goto('/watches/hamilton/khaki-field-auto-h70455553?lang=en');
  await expect(page.locator('.intro .eyebrow')).toContainText('Hamilton Khaki Field Auto');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'test-results/watch-hamilton-intro.png' });
  const [x, y] = await page.evaluate(() => window.__caseback!.project('balance'));
  expect(x).toBeGreaterThan(0);
  expect(y).toBeGreaterThan(0);
});

test('dive bezel watch opens into the same tour', async ({ page }) => {
  await page.goto('/watches/tudor/heritage-black-bay-79220b?lang=ja');
  await ready(page);
  await page.getByRole('button', { name: '裏蓋を開ける' }).click();
  await expect.poll(() => page.evaluate(() => window.__caseback!.state().mode), { timeout: 45_000 }).toBe('tour');
  await expect(page.locator('.info h1')).toHaveText('動力が時を刻むまで');
});

test('home lists calibers and watches and searches', async ({ page }) => {
  await page.goto('/?lang=en');
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.locator('.home .watch')).toHaveCount(3);
  await page.getByRole('searchbox').fill('sinn');
  await expect(page.locator('.home .watch')).toHaveCount(1);
  await page.locator('.home .watch a').first().click();
  await expect(page).toHaveURL(/\/watches\/sinn\/556/);
  await expect(page.locator('.intro .eyebrow')).toContainText('Sinn 556');
});

test('caliber watch list', async ({ page }) => {
  await page.goto('/calibers/eta-2824-2/watches?lang=ja');
  await expect(page.locator('.caliber-watches .watch')).toHaveCount(3);
  await expect(page.locator('.caliber-watches')).toContainText('ETA 2824-2');
});

test('unknown paths show the home page', async ({ page }) => {
  await page.goto('/watches/tudor/nope');
  await expect(page.locator('.home')).toBeVisible();
});

test('display caseback lets you see the movement, a solid one does not', async ({ page }) => {
  const firstHits = async (url: string) => {
    await page.goto(url);
    await ready(page);
    await page.waitForTimeout(1500);
    const [x, y] = await page.evaluate(() => window.__caseback!.project('balance'));
    return page.evaluate(([px, py]) => window.__caseback!.hits(px!, py!), [x, y]);
  };
  const glass = await firstHits('/watches/hamilton/khaki-field-auto-h70455553?lang=en');
  expect(glass[0]).toBe('caseback-glass');
  const solid = await firstHits('/watches/sinn/556?lang=en');
  expect(solid[0]).toBe('caseback-solid');
});

test('resizing the window does not move the camera', async ({ page }) => {
  await page.goto('/calibers/eta-2824-2?lang=ja');
  await ready(page);
  await page.waitForTimeout(3000);
  const before = await page.evaluate(() => window.__caseback!.camera());
  await page.setViewportSize({ width: 1400, height: 880 });
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => window.__caseback!.camera());
  const moved = Math.hypot(after[0] - before[0], after[1] - before[1], after[2] - before[2]);
  // Auto-rotation moves the camera a little in 100 ms; a reset to the start pose moves it much more.
  expect(moved).toBeLessThan(0.5);
});

test('the camera keeps looking at its target during chapter flights', async ({ page }) => {
  await openTour(page);
  await page.waitForTimeout(2000);
  const worst = await page.evaluate(async () => {
    const h = window.__caseback!;
    const errs: number[] = [];
    let on = true;
    const tick = () => {
      const [x, y, z, w] = h.quat() as [number, number, number, number];
      // Camera forward is -Z rotated by the quaternion.
      const fx = -(2 * (x * z + w * y));
      const fy = -(2 * (y * z - w * x));
      const fz = -(1 - 2 * (x * x + y * y));
      const c = h.camera();
      const t = h.target();
      const d: [number, number, number] = [t[0] - c[0], t[1] - c[1], t[2] - c[2]];
      const n = Math.hypot(...d);
      errs.push(Math.acos(Math.min(1, (fx * d[0] + fy * d[1] + fz * d[2]) / n)));
      if (on) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    [...document.querySelectorAll<HTMLButtonElement>('.tourbar .chapters button')].find((b) => b.textContent === '針を動かす')!.click();
    await new Promise((r) => setTimeout(r, 2400));
    on = false;
    return Math.max(...errs);
  });
  expect(worst).toBeLessThan(0.02);
});
