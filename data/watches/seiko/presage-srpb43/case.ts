import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { hollowCaseback } from '../../../../src/scene/exterior/kit/caseback';
import { extrudeProfile, roundedConvex, smax, smin } from '../../../../src/scene/exterior/kit/sdf';
import { surfaceNets } from '../../../../src/scene/exterior/kit/surfaceNets';
import { P } from './params';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// Every height hangs off the crystal apex, which sits a measured distance in front of the stem axis the crown is on.
export const crystalTop = (m: MovementFrame) => m.stemZ - P.crystalTopToStem;
// The case middle's front face (the bezel seat).
export const caseFront = (m: MovementFrame) => crystalTop(m) + P.caseFrontBelowTop;
export const caseBack = (m: MovementFrame) => caseFront(m) + P.caseHeight;

// The Cocktail Time's case middle: a 40.5 mm drum, all polished, whose lugs are wedges drawn tangent to it and bent
// sharply down toward the wrist; their undersides run on below the case middle, level with the caseback at the tip.
// `counter`, when given, counts the evaluations that get past the cheap early exits.
export function caseShape(m: MovementFrame, counter?: { full: number }) {
  const R = P.caseRadius;
  const lw = P.lugGap / 2;
  const tip = P.lugToLug / 2;
  const F = caseFront(m);
  const back = caseBack(m);
  const xo = lw + P.lugWidth;
  const phi = Math.atan2(tip, xo) - Math.acos(R / Math.hypot(xo, tip));
  const tx = R * Math.cos(phi), ty = R * Math.sin(phi);
  const lug = roundedConvex([[lw, 0], [tx, ty], [xo, tip], [lw, tip]], P.lugTipRound);
  const ol = Math.hypot(xo - tx, tip - ty), onx = (tip - ty) / ol, ony = (tx - xo) / ol, oc = onx * tx + ony * ty;
  const plan = (x: number, y: number) => {
    const disc = Math.hypot(x, y) - R;
    if (disc < -2) return disc;
    const ax = Math.abs(x), ay = Math.abs(y);
    const bound = Math.max(lw - ax, onx * ax + ony * ay - oc, ay - tip);
    if (bound >= disc + P.lugFillet) return disc;
    return ax < lw + 2 * P.lugFillet ? smin(disc, lug(ax, ay), P.lugFillet) : Math.min(disc, lug(ax, ay));
  };
  // 0 at the drum's edge, 1 at the lug tip, measured along the lug.
  const run = (x: number, y: number) => {
    const edge = Math.sqrt(Math.max(R * R - x * x, 0));
    return clamp01((Math.abs(y) - edge) / (tip - edge));
  };
  const front = (x: number, y: number) => F + P.lugDrop * run(x, y) ** P.lugCurve;
  const underside = (x: number, y: number) => back + P.lugBelow * run(x, y) ** P.lugBelowCurve;
  // The spring bar's axis. The hole itself isn't drilled: the strap's end hides it, and at this lug thickness the bore
  // leaves a wall thinner than the mesh step.
  const holeY = tip - P.holeInset;
  const hole = { y: holeY, z: (front(lw + P.lugWidth / 2, holeY) + underside(lw + P.lugWidth / 2, holeY)) / 2 };
  const opts = { chamfer: P.bevel, backChamfer: P.backChamfer, edge: P.edge };

  let cx = NaN, cy = NaN, cPlan = 0, cFront = 0, cBack = 0, cBore = 0;
  const column = (x: number, y: number) => {
    if (x === cx && y === cy) return;
    cx = x; cy = y; cPlan = plan(x, y); cFront = front(x, y); cBack = underside(x, y); cBore = P.bore - Math.hypot(x, y);
  };
  const sdf = (x: number, y: number, z: number) => {
    column(x, y);
    if (cPlan > 1) return cPlan;
    if (cBore > 1) return cBore;
    // The lug's faces are steep, so the vertical distances overstate the true one: keep a wider band.
    if (cFront - z > 2) return (cFront - z) / 2;
    if (z - cBack > 2) return (z - cBack) / 2;
    if (counter) counter.full++;
    return smax(extrudeProfile(cPlan, cFront - z, z - cBack, opts), cBore, P.edge);
  };
  return { sdf, front, underside, back, hole, bounds: { x: R + 0.5, y: tip + 0.5, z: [F - 0.5, back + P.lugBelow + 0.5] as [number, number] } };
}

export function presageCase(m: MovementFrame, step: number): ExteriorLayer[] {
  const s = caseShape(m);
  const b = s.bounds;
  return [{ geometry: surfaceNets(s.sdf, [-b.x, -b.y, b.z[0]], [b.x, b.y, b.z[1]], step), material: 'case' }];
}

// A screw-down display back, hollowed so the movement's rotor clears it closed and while it lifts off.
export function presageCaseback(m: MovementFrame): ExteriorLayer[] {
  return hollowCaseback({
    radius: P.caseRadius - 0.6, taper: 0.9, seat: caseBack(m), thickness: P.casebackThickness,
    pocket: m.diameterMm / 2 + 0.5, back: { kind: 'display', glass: P.glassThickness, recess: 0.25 },
  });
}
