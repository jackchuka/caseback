import type { WatchExterior } from '../model/watch';
export function caseRadii(movementDiameterMm: number, ext?: WatchExterior) {
  const r = movementDiameterMm / 2;
  if (!ext) return { inner: r + 0.35, outer: r + 3.5, height: 7.8, bottom: -2.8 };
  const outer = ext.case.diameterMm / 2;
  return { inner: Math.max(r + 0.35, outer - 3.2), outer, height: ext.case.thicknessMm * 0.62, bottom: -2.8 };
}
