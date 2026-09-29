import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { hollowCaseback } from '../../../../src/scene/exterior/kit/caseback';
import { softFinish } from '../../../../src/scene/exterior/kit/polish';
import { caseColumn, clamp01, extrudeProfile, lugRun, roundedConvex, smax, smin } from '../../../../src/scene/exterior/kit/sdf';
import { polishedMesh } from '../../../../src/scene/exterior/kit/surfaceNets';
import { S } from './params';

// Everything hangs off the bezel top, so the published 11 mm runs from it to the caseback.
export const bezelTop = (m: MovementFrame) => m.frontZ - S.bezelTopOffset;
// The case middle's front face (the bezel seat) and back face (the caseback seat).
export const caseFront = (m: MovementFrame) => bezelTop(m) + S.bezelHeight;
export const caseBack = (m: MovementFrame) => bezelTop(m) + S.totalThickness - S.casebackThickness;

// The 556's case middle: a 38.5 mm drum under a bezel of the same size; slim lugs whose outer edges run in toward
// the tip and meet the drum in a broad concave sweep; flat vertical flanks; at 3 o'clock two blocky guards with the
// crown between them; the lug tops falling toward the wrist; spring-bar holes drilled right through. Satin all over,
// with a thin bright bevel along the top edge.
// `counter`, when given, counts the evaluations that get past the cheap early exits: the build's real work.
export function caseShape(m: MovementFrame, counter?: { full: number }) {
  const R = S.caseRadius;
  const lw = S.lugGap / 2;
  const tip = S.lugToLug / 2;
  const F = caseFront(m);
  const back = caseBack(m);
  const G = S.guard;
  const A = S.lugArc;
  const lug = (ax: number, ay: number) =>
    smax(Math.max(lw - ax, S.lugFrom - ay, A.r - Math.hypot(ax - A.x, ay - A.y)), ay - tip, S.lugTipRound);
  // Two pads side by side at 3 o'clock, the notch between them left open for the crown.
  const guard = roundedConvex([[R - 2, G.notch], [G.outer, G.notch], [G.outer, G.flat], [R - 1, G.foot], [R - 2, G.foot]], 0.3);
  const plan = (x: number, y: number) => {
    const disc = Math.hypot(x, y) - R;
    // Deep inside the drum only the sign matters.
    if (disc < -2) return disc;
    const ax = Math.abs(x), ay = Math.abs(y);
    let d = disc;
    // The lug can only matter within its blend of the lug's own bounds.
    if (ay > S.lugFrom - S.lugBlend && ax < R + 1) d = smin(d, lug(ax, ay), S.lugBlend);
    if (x > 0 && ay < G.foot + G.blend + 1) d = smin(d, guard(x, ay), G.blend);
    return d;
  };
  // 0 at the bezel's edge, 1 at the lug tip, measured along the lug; zero on the guards.
  const run = lugRun(R, tip, 8);
  const front = (x: number, y: number) => F + S.lugDrop * run(x, y) ** S.lugCurve;
  const underside = (y: number) => back - S.lugHeel * clamp01((Math.abs(y) - tip + S.lugHeelRun) / S.lugHeelRun) ** 2;
  const holeY = tip - S.holeInset;
  const hole = { y: holeY, z: (front(lw + 1, holeY) + underside(holeY)) / 2 };
  const opts = { chamfer: S.bevel, backChamfer: S.backChamfer, edge: S.edge };

  const column = caseColumn(plan, front, (_x, y) => underside(y), S.bore);
  // Through the lug: the photos show the holes on the outer flanks.
  const drill = (y: number, z: number) => S.holeRadius - Math.hypot(Math.abs(y) - hole.y, z - hole.z);
  const sdf = (x: number, y: number, z: number) => {
    const c = column(x, y);
    // Columns well outside the outline or inside the bore need no detail; most of the grid is one of these.
    if (c.plan > 1) return c.plan;
    if (c.bore > 1) return c.bore;
    if (c.front - z > 1) return c.front - z;
    if (z - c.back > 1) return z - c.back;
    if (counter) counter.full++;
    const solid = smax(extrudeProfile(c.plan, c.front - z, z - c.back, opts), c.bore, S.edge);
    return Math.abs(Math.abs(y) - hole.y) > S.holeRadius + 1 ? solid : Math.max(solid, drill(y, z));
  };
  // 0 satin … 1 polished: only the top bevel catches the light as a bright line.
  const polish = (x: number, y: number, z: number) => {
    const c = column(x, y);
    const vf = c.front - z, vb = z - c.back;
    return softFinish([[0, vf], [0, c.bore], [0, c.plan], [0, vb], [1, (c.plan + vf + S.bevel) / Math.SQRT2], [0, (c.plan + vb + S.backChamfer) / Math.SQRT2], [0, drill(y, z)]]);
  };
  return { sdf, polish, front, back, hole, bounds: { x: G.outer + 0.5, y: tip + 0.5, z: [F - 0.5, back + 0.5] as [number, number] } };
}

export function sinnCase(m: MovementFrame, step: number): ExteriorLayer[] {
  const s = caseShape(m);
  const b = s.bounds;
  return [{ geometry: polishedMesh(s.sdf, s.polish, [-b.x, -b.y, b.z[0]], [b.x, b.y, b.z[1]], step), material: 'case' }];
}

// A display back: a satin ring around a sapphire, hollowed so the rotor clears it.
export function sinnCaseback(m: MovementFrame): ExteriorLayer[] {
  return hollowCaseback({
    radius: S.caseRadius - 0.8, taper: 0.4, seat: caseBack(m), thickness: S.casebackThickness,
    pocket: m.diameterMm / 2 + S.casebackPocketClearance, back: { kind: 'display', glass: S.casebackGlass, recess: S.casebackRecess },
  });
}
