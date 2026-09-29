import { expect, type Page } from '@playwright/test';

export const state = (page: Page) => page.evaluate(() => window.__caseback!.state());
export const angle = (page: Page, id: string) => page.evaluate((i) => window.__caseback!.angle(i), id);

export async function ready(page: Page) {
  await page.waitForFunction(() => window.__caseback !== undefined, null, { timeout: 30_000 });
}

export async function openTour(page: Page, caliberId: string, lang: 'en' | 'ja' = 'en') {
  await page.goto(`/calibers/${caliberId}?lang=${lang}`);
  await ready(page);
  await page.getByRole('button', { name: lang === 'en' ? 'Open the caseback' : '裏蓋を開ける' }).click();
  await expect.poll(async () => (await state(page)).mode, { timeout: 45_000 }).toBe('tour');
}

export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}
