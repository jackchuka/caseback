import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { hollowCaseback } from '../../../../src/scene/exterior/kit/caseback';
import { softFinish } from '../../../../src/scene/exterior/kit/polish';
import { extrudeProfile, roundedConvex, smax, smin } from '../../../../src/scene/exterior/kit/sdf';
import { polishedMesh } from '../../../../src/scene/exterior/kit/surfaceNets';
import { S } from './params';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

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
  const guard = roundedConvex([[R - 2, G.notch], [G.outer, G.notch], [G.outer, G.width], [R - 2, G.width]], 0.3);
  const plan = (x: number, y: number) => {
    const disc = Math.hypot(x, y) - R;
    // Deep inside the drum only the sign matters.
    if (disc < -2) return disc;
    const ax = Math.abs(x), ay = Math.abs(y);
    let d = disc;
    // The lug can only matter within its blend of the lug's own bounds.
    if (ay > S.lugFrom - S.lugBlend && ax < R + 1) d = smin(d, lug(ax, ay), S.lugBlend);
    if (x > 0 && ay < G.width + G.blend + 1) d = smin(d, guard(x, ay), G.blend);
    return d;
  };
  // 0 at the bezel's edge, 1 at the lug tip, measured along the lug; zero on the guards.
  const run = (x: number, y: number) => {
    const edge = Math.max(Math.sqrt(Math.max(R * R - x * x, 0)), 8);
    return clamp01((Math.abs(y) - edge) / (tip - edge));
  };
  const front = (x: number, y: number) => F + S.lugDrop * run(x, y) ** S.lugCurve;
  const underside = (y: number) => back - S.lugHeel * clamp01((Math.abs(y) - tip + S.lugHeelRun) / S.lugHeelRun) ** 2;
  const holeY = tip - S.holeInset;
  const hole = { y: holeY, z: (front(lw + 1, holeY) + underside(holeY)) / 2 };
  const opts = { chamfer: S.bevel, backChamfer: S.backChamfer, edge: S.edge };

  let cx = NaN, cy = NaN, cPlan = 0, cFront = 0, cBack = 0, cBore = 0;
  const column = (x: number, y: number) => {
    if (x === cx && y === cy) return;
    cx = x; cy = y; cPlan = plan(x, y); cFront = front(x, y); cBack = underside(y); cBore = S.bore - Math.hypot(x, y);
  };
  // Through the lug: the photos show the holes on the outer flanks.
  const drill = (y: number, z: number) => S.holeRadius - Math.hypot(Math.abs(y) - hole.y, z - hole.z);
  const sdf = (x: number, y: number, z: number) => {
    column(x, y);
    // Columns well outside the outline or inside the bore need no detail; most of the grid is one of these.
    if (cPlan > 1) return cPlan;
    if (cBore > 1) return cBore;
    if (cFront - z > 1) return cFront - z;
    if (z - cBack > 1) return z - cBack;
    if (counter) counter.full++;
    const solid = smax(extrudeProfile(cPlan, cFront - z, z - cBack, opts), cBore, S.edge);
    return Math.abs(Math.abs(y) - hole.y) > S.holeRadius + 1 ? solid : Math.max(solid, drill(y, z));
  };
  // 0 satin … 1 polished: only the top bevel catches the light as a bright line.
  const polish = (x: number, y: number, z: number) => {
    column(x, y);
    const vf = cFront - z, vb = z - cBack;
    return softFinish([[0, vf], [0, cBore], [0, cPlan], [0, vb], [1, (cPlan + vf + S.bevel) / Math.SQRT2], [0, (cPlan + vb + S.backChamfer) / Math.SQRT2], [0, drill(y, z)]]);
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
