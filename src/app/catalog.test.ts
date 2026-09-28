import { describe, expect, it } from 'vitest';
import { searchCatalog } from './catalog';
import { calibers } from '../../data/calibers';
import { watches } from '../../data/watches';

const all = () => searchCatalog('', Object.values(calibers), Object.values(watches));

describe('searchCatalog', () => {
  it('returns everything for an empty query', () => {
    expect(all().watches.length).toBe(Object.keys(watches).length);
    expect(all().calibers.length).toBe(Object.keys(calibers).length);
  });
  it('matches brand, model, reference and caliber name case-insensitively', () => {
    const q = (s: string) => searchCatalog(s, Object.values(calibers), Object.values(watches));
    expect(q('sinn').watches.map((w) => w.brand)).toEqual(['Sinn', 'Sinn']);
    expect(q('7750').watches.map((w) => w.reference)).toEqual(['103.061']);
    expect(q('7750').calibers.map((c) => c.id)).toEqual(['valjoux-7750']);
    expect(q('79220').watches.map((w) => w.model)).toEqual(['Heritage Black Bay']);
    expect(q('2824').watches.length).toBe(Object.values(watches).filter((w) => w.caliberId === 'eta-2824-2').length);
    expect(q('2824').calibers.map((c) => c.id)).toEqual(['eta-2824-2']);
    expect(q('nh35').watches.map((w) => w.reference)).toEqual(['SRPB43']);
    expect(q('nh35').calibers.map((c) => c.id)).toEqual(['seiko-nh35a']);
    expect(q('zzz').watches).toEqual([]);
  });
});
