import * as THREE from 'three';
import { sampled2d } from '../../../../src/scene/exterior/kit/field2d';
import { polygonSdf, type P2 } from '../../../../src/scene/exterior/kit/sdf';
import { mirrored, TRACE, V } from './params';

// The plan outlines in watch millimetres, each closed across the 3–9 line.
export const outlines = {
  tier0: mirrored(TRACE.tier0),
  tier1: mirrored(TRACE.tier1),
  tier2: mirrored(TRACE.tier2),
  dial: mirrored(TRACE.dial),
};

// Tabulated plan fields over the case's footprint, built once per module. Every outline is mirror-symmetric about the
// 3–9 line, so only the upper half is tabulated.
const MIN: P2 = [-22.5, -24], MAX: P2 = [22.5, 0];
const STEP = 0.1;
const half = (pts: P2[]) => {
  const f = sampled2d(polygonSdf(pts), MIN, MAX, STEP);
  return (x: number, y: number) => f(x, -Math.abs(y));
};
let fields: { tiers: Array<(x: number, y: number) => number>; dial: (x: number, y: number) => number } | null = null;
export function planFields() {
  fields ??= { tiers: [outlines.tier0, outlines.tier1, outlines.tier2].map(half), dial: half(outlines.dial) };
  return fields;
}

// The caseback plate follows tier 0 stepped in from the wings; its window steps in again, less a notch on the crown
// side below 3 o'clock (the back is seen mirrored, so on the photo it sits lower left).
export function casebackPlan() {
  const { tiers } = planFields();
  const { inset, window: frame, notch } = V.caseback;
  const plate = (x: number, y: number) => tiers[0]!(x, y) + inset;
  const cut = polygonSdf([[notch.x, notch.y], [30, notch.y], [30, 30], [notch.x, 30]]);
  const window = (x: number, y: number) => Math.max(plate(x, y) + frame, x - V.caseback.crownSide, -cut(x, y));
  return { plate, window };
}

export const shapeOf = (pts: P2[]) => {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
};
export const pathOf = (pts: P2[]) => {
  const s = new THREE.Path();
  pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
};
