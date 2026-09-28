import type { LegacyConfig } from '../../../../src/scene/exterior/legacy/config';
import { legacyRound } from '../../../../src/scene/exterior/legacy';

export const config: LegacyConfig = {
  case: { diameterMm: 38, thicknessMm: 11, lugToLugMm: 47, lugWidthMm: 20, material: 'steel', finish: { top: 'brushed', flank: 'brushed' }, flank: 'straight', chamferMm: 0.4, lugs: { widthMm: 3.0, taper: 0.95, drilled: false } },
  bezel: { kind: 'plain', widthMm: 1.4, profile: 'sloped', finish: 'polished' },
  crown: { diameterMm: 6.5, lengthMm: 3.5, tube: false, guards: false },
  crystal: { domeMm: 0.6 },
  dial: { color: '#cfcfca', finish: 'sunburst', indices: 'arabic-24', indexColor: '#1a1a1a', lume: '#e8e2cf', dateWindow: true },
  hands: { style: 'syringe', color: 'silver', seconds: true },
  strap: { kind: 'leather', color: '#6b4226' },
  caseback: 'display',
};

export default legacyRound(config);
