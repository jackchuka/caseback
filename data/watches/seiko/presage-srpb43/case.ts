import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { hollowCaseback } from '../../../../src/scene/exterior/kit/caseback';
import { caseColumn, extrudeProfile, lugRun, roundedConvex, smax, smin } from '../../../../src/scene/exterior/kit/sdf';
import { surfaceNets } from '../../../../src/scene/exterior/kit/surfaceNets';
import { P } from './params';

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
  // Each lug is a wedge from the drum to its tip whose outer edge leaves the drum at a (slightly rounded) corner.
  const ry = P.lugRoot, rx = Math.sqrt(R * R - ry * ry);
  const lug = roundedConvex([[lw, 0], [rx, ry], [xo, tip], [lw, tip]], P.lugTipRound);
  const plan = (x: number, y: number) => {
    const disc = Math.hypot(x, y) - R;
    if (disc < -2 || Math.abs(y) < ry - 2 * P.lugFillet) return disc;
    return smin(disc, lug(Math.abs(x), Math.abs(y)), P.lugFillet);
  };
  const run = lugRun(R, tip);
  const front = (x: number, y: number) => F + P.lugDrop * run(x, y) ** P.lugCurve;
  const underside = (x: number, y: number) => back + P.lugBelow * run(x, y) ** P.lugBelowCurve;
  // The spring bar's axis. The hole itself isn't drilled: the strap's end hides it, and at this lug thickness the bore
  // leaves a wall thinner than the mesh step.
  const holeY = tip - P.holeInset;
  const hole = { y: holeY, z: (front(lw + P.lugWidth / 2, holeY) + underside(lw + P.lugWidth / 2, holeY)) / 2 };
  const opts = { chamfer: P.bevel, backChamfer: P.backChamfer, edge: P.edge };

  const column = caseColumn(plan, front, underside, P.bore);
  const sdf = (x: number, y: number, z: number) => {
    const c = column(x, y);
    if (c.plan > 1) return c.plan;
    if (c.bore > 1) return c.bore;
    // The lug's faces are steep, so the vertical distances overstate the true one: keep a wider band.
    if (c.front - z > 2) return (c.front - z) / 2;
    if (z - c.back > 2) return (z - c.back) / 2;
    if (counter) counter.full++;
    return smax(extrudeProfile(c.plan, c.front - z, z - c.back, opts), c.bore, P.edge);
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
