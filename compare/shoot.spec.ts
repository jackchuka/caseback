import { expect, test, type Page } from '@playwright/test';

type Hook = { __compare?: { watches?: string[]; shots?: string[] } };
const OUT = 'test-results/compare';
const slug = (id: string) => id.replace('/', '-');

// Settled once the canvas is up, the photo (if any) has decoded, and the renderer has drawn a run of frames.
async function shoot(page: Page, url: string, file: string) {
  await page.goto(url);
  await expect(page.locator('.compare-canvas canvas')).toBeVisible();
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((i) => i.decode().catch(() => undefined)));
    await new Promise<void>((done) => {
      let n = 0;
      const tick = () => (++n >= 20 ? done() : requestAnimationFrame(tick));
      requestAnimationFrame(tick);
    });
  });
  // Only the canvas and its overlay: the stage is wider than the photo and mostly empty.
  await page.locator('.compare-canvas').screenshot({ path: `${OUT}/${file}.png` });
}

test('renders every compare view without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dev/compare');
  await page.waitForFunction(() => (window as Hook).__compare?.watches !== undefined);
  const all = await page.evaluate(() => (window as Hook).__compare!.watches!);
  const ids = process.env.WATCH ? [process.env.WATCH] : all;
  for (const id of ids) {
    // Naming a shot means calibrating against that photo: skip the view renders.
    if (!process.env.SHOT) for (const view of ['front', 'side', 'three-quarter']) await shoot(page, `/dev/compare/${id}?view=${view}&mode=model`, `${slug(id)}-${view}-model`);
    const shots = process.env.SHOT ? [process.env.SHOT] : await page.goto(`/dev/compare/${id}`).then(async () => (await page.waitForFunction(() => (window as Hook).__compare?.shots)).jsonValue() as Promise<string[]>);
    for (const s of shots) {
      await shoot(page, `/dev/compare/${id}?shot=${s}&mode=model`, `${slug(id)}-shot-${s}-model`);
      await shoot(page, `/dev/compare/${id}?shot=${s}&mode=overlay`, `${slug(id)}-shot-${s}-overlay`);
    }
  }
  expect(errors).toEqual([]);
});
