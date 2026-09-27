import type { TourStep } from '../model/schema';
import type { Lang } from '../state/store';

export type UrlState = { caliberId: string; lang: Lang | null; stepIndex: number | null };

export type Route =
  | { kind: 'home' }
  | { kind: 'caliber'; caliberId: string; watchId: null }
  | { kind: 'watch'; caliberId: string; watchId: string }
  | { kind: 'caliber-watches'; caliberId: string };

export function parseRoute(pathname: string, base: string, calibers: Record<string, unknown>, watches: Record<string, { caliberId: string }>): Route {
  const rel = (pathname.startsWith(base) ? pathname.slice(base.length) : pathname).replace(/^\/+|\/+$/g, '');
  const parts = rel.split('/').filter(Boolean);
  if (parts[0] === 'calibers' && parts[1] && calibers[parts[1]]) {
    if (parts.length === 2) return { kind: 'caliber', caliberId: parts[1], watchId: null };
    if (parts.length === 3 && parts[2] === 'watches') return { kind: 'caliber-watches', caliberId: parts[1] };
  }
  if (parts[0] === 'watches' && parts.length === 3) {
    const id = `${parts[1]}/${parts[2]}`;
    const w = watches[id];
    if (w) return { kind: 'watch', caliberId: w.caliberId, watchId: id };
  }
  return { kind: 'home' };
}

export function legacyRedirect(pathname: string, search: string, base: string, defaultCaliber: string): string | null {
  const rel = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  if (rel.replace(/\//g, '') !== '') return null;
  const q = new URLSearchParams(search);
  if (!q.has('ch') && !q.has('part')) return null;
  return `${base}calibers/${defaultCaliber}${search}`;
}

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
