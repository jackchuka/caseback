import { describe, expect, it } from 'vitest';
import { legacyRedirect, parseLocation, parseRoute, toSearch } from './url';
import { watches } from '../../data/watches';
import { calibers, DEFAULT_CALIBER } from '../../data/calibers';

const parse = (pathname: string, search = '', base = '/') => parseLocation({ pathname, search }, base, calibers, DEFAULT_CALIBER);
const tour = calibers['eta-2824-2']!.tour;

describe('parseLocation', () => {
  it('defaults to the default caliber with no step', () => {
    expect(parse('/')).toEqual({ caliberId: 'eta-2824-2', lang: null, stepIndex: null });
  });
  it('reads the caliber path under a base', () => {
    expect(parse('/caseback/calibers/eta-2824-2', '', '/caseback/').caliberId).toBe('eta-2824-2');
  });
  it('reads lang, chapter and part', () => {
    const r = parse('/', '?lang=en&ch=time&part=escape');
    expect(r.lang).toBe('en');
    expect(r.stepIndex).toBe(tour.findIndex((s) => s.id === 'time-escape'));
  });
  it('reads a chapter without a part as its first step', () => {
    expect(parse('/', '?ch=time').stepIndex).toBe(0);
  });
  it('ignores invalid deep links', () => {
    expect(parse('/calibers/nope')).toEqual({ caliberId: 'eta-2824-2', lang: null, stepIndex: null });
    expect(parse('/', '?lang=fr&ch=zzz&part=ghost')).toEqual({ caliberId: 'eta-2824-2', lang: null, stepIndex: null });
  });
});

describe('toSearch', () => {
  it('round-trips through parseLocation', () => {
    const step = tour[3]!;
    const r = parse('/', toSearch('en', step));
    expect(r).toEqual({ caliberId: 'eta-2824-2', lang: 'en', stepIndex: 3 });
  });
  it('omits the part for the overview', () => {
    expect(toSearch('ja', tour[0]!)).toBe('?lang=ja&ch=time');
  });
});

describe('parseRoute', () => {
  const r = (p: string) => parseRoute(p, '/', calibers, watches);
  it('routes home, calibers, watch lists and watches', () => {
    expect(r('/')).toEqual({ kind: 'home' });
    expect(r('/calibers/eta-2824-2')).toEqual({ kind: 'caliber', caliberId: 'eta-2824-2', watchId: null });
    expect(r('/calibers/eta-2824-2/watches')).toEqual({ kind: 'caliber-watches', caliberId: 'eta-2824-2' });
    expect(r('/watches/sinn/556')).toEqual({ kind: 'watch', caliberId: 'eta-2824-2', watchId: 'sinn/556' });
  });
  it('parseRoute falls back to home', () => {
    for (const p of ['/watches/foo', '/watches/tudor/nope', '/calibers/x/watches', '/calibers/x', '/nope']) expect(r(p)).toEqual({ kind: 'home' });
  });
});
describe('legacyRedirect', () => {
  it('legacy query redirects', () => {
    expect(legacyRedirect('/', '?lang=en&ch=time&part=escape', '/', 'eta-2824-2')).toBe('/calibers/eta-2824-2?lang=en&ch=time&part=escape');
    expect(legacyRedirect('/', '?lang=en', '/', 'eta-2824-2')).toBeNull();
    expect(legacyRedirect('/calibers/eta-2824-2', '?ch=time', '/', 'eta-2824-2')).toBeNull();
  });
});
