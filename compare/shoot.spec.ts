import { expect, test, type Page } from '@playwright/test';

type Hook = { __compare?: { watches?: string[]; shots?: string[] } };
const OUT = 'test-results/compare';
const slug = (id: string) => id.replace('/', '-');

async function shoot(page: Page, url: string, file: string) {
  await page.goto(url);
  await expect(page.locator('.compare-canvas canvas')).toBeVisible();
  await page.waitForTimeout(2500);
  await page.locator('.compare-stage').screenshot({ path: `${OUT}/${file}.png` });
}

test('renders every compare view without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dev/compare');
  await page.waitForFunction(() => (window as Hook).__compare?.watches !== undefined);
  const all = await page.evaluate(() => (window as Hook).__compare!.watches!);
  const ids = process.env.WATCH ? [process.env.WATCH] : all;
  for (const id of ids) {
    for (const view of ['front', 'side', 'three-quarter']) await shoot(page, `/dev/compare/${id}?view=${view}&mode=model`, `${slug(id)}-${view}-model`);
    const shots = await page.evaluate(() => (window as Hook).__compare?.shots ?? []);
    for (const s of shots.filter((x) => !process.env.SHOT || x === process.env.SHOT)) {
      await shoot(page, `/dev/compare/${id}?shot=${s}&mode=model`, `${slug(id)}-${s}-model`);
      await shoot(page, `/dev/compare/${id}?shot=${s}&mode=overlay`, `${slug(id)}-${s}-overlay`);
    }
  }
  expect(errors).toEqual([]);
});
