import { describe, expect, it } from 'vitest';
import { WatchSchema, validateWatch, type Watch } from './watch';

const w = (): Watch => ({
  id: 'acme/diver', brand: 'Acme', model: 'Diver', reference: 'A1', caliberId: 'eta-2824-2',
  exterior: { case: { diameterMm: 40, thicknessMm: 12, lugWidthMm: 20, material: 'steel' }, bezel: { kind: 'plain' }, crown: { diameterMm: 6, lengthMm: 3 }, caseback: 'solid' },
  sources: [{ id: 's', title: 'S', url: 'https://example.com' }],
});

describe('watch schema', () => {
  it('accepts a valid watch', () => {
    expect(() => WatchSchema.parse(w())).not.toThrow();
  });
  it('rejects an id that is not brand/model', () => {
    expect(() => WatchSchema.parse({ ...w(), id: 'diver' })).toThrow();
  });
  it('reports unknown calibers and cases smaller than the movement', () => {
    const bad = { ...w(), caliberId: 'nope' };
    expect(validateWatch(bad, { 'eta-2824-2': { specs: { diameterMm: 25.6 } } })).toContain('acme/diver: unknown caliber nope');
    const tiny = w();
    tiny.exterior.case.diameterMm = 26;
    expect(validateWatch(tiny, { 'eta-2824-2': { specs: { diameterMm: 25.6 } } })).toContain('acme/diver: case 26 mm cannot hold a 25.6 mm movement');
  });
});
