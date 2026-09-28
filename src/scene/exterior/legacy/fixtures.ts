import type { LegacyConfig } from './config';

// A dive-bezel, tubed-crown configuration kept for the legacy generator's own tests (from the pre-rebuild Tudor).
export const DIVER: LegacyConfig = {
  case: { diameterMm: 41, thicknessMm: 13, lugToLugMm: 50, lugWidthMm: 22, material: 'steel', finish: { top: 'brushed', flank: 'polished' }, flank: 'sloped', chamferMm: 0.8, lugs: { widthMm: 3.6, taper: 1, drilled: false } },
  bezel: { kind: 'dive', widthMm: 3.4, finish: 'polished', color: '#c8cbd0', insertColor: '#1f3f8f' },
  crown: { diameterMm: 8, lengthMm: 4, tube: true, tubeColor: '#1f3f8f', guards: false },
  crystal: { domeMm: 1.2 },
  dial: { color: '#0d0d0f', finish: 'gloss', indices: 'diver-dots', indexColor: '#efe9dc', lume: '#efe9dc', dateWindow: false },
  hands: { style: 'pencil', color: 'silver', seconds: true, secondsDot: true },
  strap: { kind: 'bracelet', color: '#c8cbd0' },
  caseback: 'solid',
};

// A plain-bezel field configuration with a date window and a leather strap (from the pre-rebuild Hamilton).
export const FIELD: LegacyConfig = {
  case: { diameterMm: 38, thicknessMm: 11, lugToLugMm: 47, lugWidthMm: 20, material: 'steel', finish: { top: 'brushed', flank: 'brushed' }, flank: 'straight', chamferMm: 0.4, lugs: { widthMm: 3.0, taper: 0.95, drilled: false } },
  bezel: { kind: 'plain', widthMm: 1.4, profile: 'sloped', finish: 'polished' },
  crown: { diameterMm: 6.5, lengthMm: 3.5, tube: false, guards: false },
  crystal: { domeMm: 0.6 },
  dial: { color: '#cfcfca', finish: 'sunburst', indices: 'arabic-24', indexColor: '#1a1a1a', lume: '#e8e2cf', dateWindow: true },
  hands: { style: 'syringe', color: 'silver', seconds: true },
  strap: { kind: 'leather', color: '#6b4226' },
  caseback: 'display',
};
