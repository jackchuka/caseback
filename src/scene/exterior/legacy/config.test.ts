import { describe, expect, it } from 'vitest';
import { validateLegacy, type LegacyConfig } from './config';

const ext = (): LegacyConfig => ({
  case: { diameterMm: 40, thicknessMm: 12, lugToLugMm: 48, lugWidthMm: 20, material: 'steel', finish: { top: 'brushed', flank: 'polished' }, flank: 'straight', chamferMm: 0.5, lugs: { widthMm: 3, taper: 1, drilled: false } },
  bezel: { kind: 'plain', widthMm: 2, profile: 'sloped', finish: 'polished' },
  crown: { diameterMm: 6, lengthMm: 3, tube: false, guards: false },
  crystal: { domeMm: 0.5 },
  dial: { color: '#111111', finish: 'matte', indices: 'bars-minute', indexColor: '#ffffff', dateWindow: false },
  hands: { style: 'baton', color: 'white', seconds: true },
  strap: { kind: 'leather', color: '#6b4226' },
  caseback: 'solid',
});

describe('validateLegacy', () => {
  it('accepts a sound case', () => {
    expect(validateLegacy(ext(), 25.6)).toEqual([]);
  });
  it('rejects a case smaller than the movement', () => {
    const tiny = ext();
    tiny.case.diameterMm = 26;
    expect(validateLegacy(tiny, 25.6)).toContain('case 26 mm cannot hold a 25.6 mm movement');
  });
  it('rejects lug-to-lug not exceeding the case', () => {
    expect(validateLegacy({ ...ext(), case: { ...ext().case, lugToLugMm: 39 } }, 25.6)).toContain('lug-to-lug must exceed the case diameter');
  });
  it('rejects lugs that reach past the round case', () => {
    expect(validateLegacy({ ...ext(), case: { ...ext().case, lugs: { widthMm: 11, taper: 1, drilled: false } } }, 25.6)).toContain('lugs are wider than the case');
  });
  it('rejects a bezel wider than a quarter of the case', () => {
    expect(validateLegacy({ ...ext(), bezel: { kind: 'dive', widthMm: 11, finish: 'brushed' } }, 25.6)).toContain('bezel too wide');
  });
});
