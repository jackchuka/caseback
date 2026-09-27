import type { TourStep } from '../model/schema';
import type { Lang } from '../state/store';

export type UrlState = { caliberId: string; lang: Lang | null; stepIndex: number | null };

export function parseLocation(
  loc: { pathname: string; search: string },
  base: string,
  calibers: Record<string, { tour: TourStep[] }>,
  defaultId: string,
): UrlState {
  const rel = loc.pathname.startsWith(base) ? loc.pathname.slice(base.length) : loc.pathname;
  const match = rel.match(/^\/?calibers\/([a-z0-9-]+)\/?$/);
  const caliberId = match && calibers[match[1]!] ? match[1]! : defaultId;
  const q = new URLSearchParams(loc.search);
  const langParam = q.get('lang');
  const lang: Lang | null = langParam === 'ja' || langParam === 'en' ? langParam : null;
  const ch = q.get('ch');
  const part = q.get('part');
  const tour = calibers[caliberId]!.tour;
  let i = -1;
  if (part) i = tour.findIndex((s) => s.focus === part && (!ch || s.chapter === ch));
  else if (ch) i = tour.findIndex((s) => s.chapter === ch);
  return { caliberId, lang, stepIndex: i >= 0 ? i : null };
}

export function toSearch(lang: Lang, step: TourStep | null): string {
  const q = new URLSearchParams({ lang });
  if (step) {
    q.set('ch', step.chapter);
    if (step.focus) q.set('part', step.focus);
  }
  return `?${q.toString()}`;
}
