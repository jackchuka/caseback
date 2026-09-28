import type { WatchExterior } from '../model/watch';
export function caseRadii(movementDiameterMm: number, ext?: WatchExterior) {
  const r = movementDiameterMm / 2;
  if (!ext) return { inner: r + 0.35, outer: r + 3.5, height: 7.8, bottom: -2.8 };
  const outer = ext.case.diameterMm / 2;
  // The opening follows the bezel: a slim bezel leaves a wide dial, as on the real watches.
  return { inner: Math.max(r + 0.35, outer - ext.bezel.widthMm - 1.0), outer, height: ext.case.thicknessMm * 0.62, bottom: -2.8 };
}

// Wide cases hold the movement in a casing ring; without it you would see through the gap to the case wall.
export function casingRing(movementRadius: number, inner: number): { rIn: number; rOut: number } | null {
  return inner - movementRadius > 0.5 ? { rIn: movementRadius + 0.05, rOut: inner } : null;
}

export function stemExtension(stemEnd: number, crownX: number, crownLength: number): { from: number; to: number } {
  return { from: stemEnd, to: Math.max(stemEnd, crownX - crownLength / 2) };
}

// The bezel's top face sits just below the case bottom so the two faces never z-fight.
export function bezelProfile(outer: number, bottom: number): Array<[number, number]> {
  const top = bottom - 0.02;
  return [[outer - 3.0, top], [outer - 0.3, top], [outer - 0.2, bottom - 0.5], [outer - 0.5, bottom - 1.0], [outer - 3.0, bottom - 1.0], [outer - 3.0, top]];
}

export type CaseRadii = ReturnType<typeof caseRadii>;
