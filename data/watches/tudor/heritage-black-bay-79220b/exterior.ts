import type { LegacyConfig } from '../../../../src/scene/exterior/legacy/config';
import { legacyRound } from '../../../../src/scene/exterior/legacy';

export const config: LegacyConfig = {
  case: { diameterMm: 41, thicknessMm: 13, lugToLugMm: 50, lugWidthMm: 22, material: 'steel', finish: { top: 'brushed', flank: 'polished' }, flank: 'sloped', chamferMm: 0.8, lugs: { widthMm: 3.6, taper: 1, drilled: false } },
  bezel: { kind: 'dive', widthMm: 3.4, finish: 'polished', color: '#c8cbd0', insertColor: '#1f3f8f' },
  crown: { diameterMm: 8, lengthMm: 4, tube: true, tubeColor: '#1f3f8f', guards: false },
  crystal: { domeMm: 1.2 },
  dial: { color: '#0d0d0f', finish: 'gloss', indices: 'diver-dots', indexColor: '#efe9dc', lume: '#efe9dc', dateWindow: false },
  hands: { style: 'pencil', color: 'silver', seconds: true, secondsDot: true },
  strap: { kind: 'bracelet', color: '#c8cbd0' },
  caseback: 'solid',
};

export default legacyRound(config);
