import { describe, expect, it } from 'vitest';
import { WatchSchema, validateWatch, type Watch } from './watch';

const ext = (): Watch['exterior'] => ({
  case: { diameterMm: 40, thicknessMm: 12, lugToLugMm: 48, lugWidthMm: 20, material: 'steel', finish: { top: 'brushed', flank: 'polished' }, flank: 'straight', chamferMm: 0.5, lugs: { widthMm: 3, taper: 1, drilled: false } },
  bezel: { kind: 'plain', widthMm: 2, profile: 'sloped', finish: 'polished' },
  crown: { diameterMm: 6, lengthMm: 3, tube: false, guards: false },
  crystal: { domeMm: 0.5 },
  dial: { color: '#111111', finish: 'matte', indices: 'bars-minute', indexColor: '#ffffff', dateWindow: false },
  hands: { style: 'baton', color: 'white', seconds: true },
  strap: { kind: 'leather', color: '#6b4226' },
  caseback: 'solid',
});

const w = (): Watch => ({
  id: 'acme/diver', brand: 'Acme', model: 'Diver', reference: 'A1', caliberId: 'eta-2824-2',
  exterior: ext(),
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
  it('rejects lug-to-lug not exceeding the case', () => {
    const bad = { ...w(), exterior: { ...ext(), case: { ...ext().case, lugToLugMm: 39 } } };
    expect(validateWatch(bad, { 'eta-2824-2': { specs: { diameterMm: 25.6 } } })).toContain('acme/diver: lug-to-lug must exceed the case diameter');
  });
  it('rejects lugs that reach past the round case', () => {
    const bad = { ...w(), exterior: { ...ext(), case: { ...ext().case, lugs: { widthMm: 11, taper: 1, drilled: false } } } };
    expect(validateWatch(bad, { 'eta-2824-2': { specs: { diameterMm: 25.6 } } })).toContain('acme/diver: lugs are wider than the case');
  });
  it('rejects a bezel wider than a quarter of the case', () => {
    const bad = { ...w(), exterior: { ...ext(), bezel: { kind: 'dive' as const, widthMm: 11, finish: 'brushed' as const } } };
    expect(validateWatch(bad, { 'eta-2824-2': { specs: { diameterMm: 25.6 } } })).toContain('acme/diver: bezel too wide');
  });
});
