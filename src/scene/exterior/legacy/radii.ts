import type { MovementFrame } from '../contract';
import type { LegacyConfig } from './config';

export type CaseRadii = { inner: number; outer: number; height: number; bottom: number };

export function caseRadii(m: Pick<MovementFrame, 'diameterMm' | 'frontZ'>, ext: LegacyConfig): CaseRadii {
  const r = m.diameterMm / 2;
  const outer = ext.case.diameterMm / 2;
  // The opening follows the bezel: a slim bezel leaves a wide dial, as on the real watches.
  return { inner: Math.max(r + 0.35, outer - ext.bezel.widthMm - 1.0), outer, height: ext.case.thicknessMm * 0.62, bottom: m.frontZ };
}

// The bezel's top face sits just below the case bottom so the two faces never z-fight.
export function bezelProfile(outer: number, bottom: number): Array<[number, number]> {
  const top = bottom - 0.02;
  return [[outer - 3.0, top], [outer - 0.3, top], [outer - 0.2, bottom - 0.5], [outer - 0.5, bottom - 1.0], [outer - 3.0, bottom - 1.0], [outer - 3.0, top]];
}
