import type { LegacyConfig } from '../../../../src/scene/exterior/legacy/config';
import { legacyRound } from '../../../../src/scene/exterior/legacy';

export const config: LegacyConfig = {
  case: { diameterMm: 38.5, thicknessMm: 11, lugToLugMm: 45.7, lugWidthMm: 20, material: 'steel', finish: { top: 'brushed', flank: 'brushed' }, flank: 'straight', chamferMm: 0.7, lugs: { widthMm: 3.4, taper: 0.7, drilled: true } },
  bezel: { kind: 'plain', widthMm: 1.5, profile: 'rounded', finish: 'brushed' },
  crown: { diameterMm: 6, lengthMm: 3, tube: false, guards: false },
  crystal: { domeMm: 0.3 },
  dial: { color: '#141416', finish: 'matte', indices: 'bars-minute', indexColor: '#f2f2f2', lume: '#f2f2f2', dateWindow: false },
  hands: { style: 'baton', color: 'silver', seconds: true },
  strap: { kind: 'bracelet', color: '#bfc2c6' },
  caseback: 'solid',
};

export default legacyRound(config);
