import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { hollowCaseback } from '../../../../src/scene/exterior/kit/caseback';
import { extrudeProfile, roundedConvex, smax, smin, type P2 } from '../../../../src/scene/exterior/kit/sdf';
import { surfaceNets } from '../../../../src/scene/exterior/kit/surfaceNets';
import { P } from './params';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// Every height hangs off the stem axis the crown sits on, as measured on the side photo.
export const crystalTop = (m: MovementFrame) => m.stemZ - P.crystalTopToStem;
export const bezelTop = (m: MovementFrame) => m.stemZ - P.bezelTopToStem;
// The case middle's front face (the bezel seat) and back face (the caseback seat).
export const caseFront = (m: MovementFrame) => m.stemZ - P.caseFrontToStem;
export const caseBack = (m: MovementFrame) => m.stemZ + P.caseBackFromStem;

// The 103's case middle: a polished drum under the bezel, faceted lugs whose straight outer edges run in toward a
// chamfered tip and whose tops fall steeply to a tall tip face, and at 3 o'clock two pads either side of the crown.
// The pushers at 2 and 4 stand in their own tubes. `counter`, when given, counts the evaluations that get past the
// cheap early exits.
export function caseShape(m: MovementFrame, counter?: { full: number }) {
  const R = P.caseRadius;
  const lw = P.lugGap / 2;
  const tip = P.lugToLug / 2;
  const F = caseFront(m);
  const back = caseBack(m);
  const G = P.guard;
  const [rx, ry] = P.lugOuter.root;
  const [ex, ey] = P.lugOuter.end;
  // The tip's diagonal runs all the way to the lug's inner edge at the lug-to-lug length.
  const lugPoly: P2[] = [[lw, 12], [rx + 0.3, 12], [rx, ry], [ex, ey], [lw, tip]];
  const lug = roundedConvex(lugPoly, 0.25);
  const guard = roundedConvex([[R - 2, G.notch], [G.outer, G.notch], [G.outer, G.flat], [R - 0.6, G.foot], [R - 2, G.foot]], 0.3);
  const plan = (x: number, y: number) => {
    const disc = Math.hypot(x, y) - R;
    if (disc < -2) return disc;
    const ax = Math.abs(x), ay = Math.abs(y);
    let d = disc;
    if (ay > 11 && ax < R) d = smin(d, lug(ax, ay), 0.5);
    if (x > 0 && ay < G.foot + G.blend + 1) d = smin(d, guard(x, ay), G.blend);
    return d;
  };
  // 0 at the drum's edge, 1 at the lug tip, measured along the lug; zero on the guards.
  const run = (x: number, y: number) => {
    const edge = Math.sqrt(Math.max(R * R - x * x, 0));
    return clamp01((Math.abs(y) - edge) / (tip - edge));
  };
  const lugTopAtRoot = m.stemZ - P.lugTopAtRoot;
  const lugDrop = m.stemZ + P.lugTopAtTip - lugTopAtRoot;
  // The lug tops start a little behind the case front and fall in a straight line to the tip face.
  const front = (x: number, y: number) => {
    const r = run(x, y);
    return r === 0 ? F : Math.max(F, lugTopAtRoot + lugDrop * r);
  };
  const underside = (x: number, y: number) => back + (m.stemZ + P.lugUnder - back) * run(x, y);
  const holeY = tip - P.holeInset;
  const hole = { y: holeY, z: (front(lw + 1.5, holeY) + underside(lw + 1.5, holeY)) / 2 };
  const opts = { chamfer: P.lugBevel, backChamfer: P.backChamfer, edge: P.edge };

  let cx = NaN, cy = NaN, cPlan = 0, cFront = 0, cBack = 0, cBore = 0;
  const column = (x: number, y: number) => {
    if (x === cx && y === cy) return;
    cx = x; cy = y; cPlan = plan(x, y); cFront = front(x, y); cBack = underside(x, y); cBore = P.bore - Math.hypot(x, y);
  };
  const sdf = (x: number, y: number, z: number) => {
    column(x, y);
    if (cPlan > 1) return cPlan;
    if (cBore > 1) return cBore;
    // The lug tops are steep, so the vertical distances overstate the true one: keep a wider band.
    if (cFront - z > 2) return (cFront - z) / 2;
    if (z - cBack > 2) return (z - cBack) / 2;
    if (counter) counter.full++;
    return smax(extrudeProfile(cPlan, cFront - z, z - cBack, opts), cBore, P.edge);
  };
  return { sdf, plan, front, underside, back, hole, bounds: { x: G.outer + 0.5, y: tip + 0.5, z: [F - 0.5, m.stemZ + P.lugUnder + 0.5] as [number, number] } };
}

export function sinnCase(m: MovementFrame, step: number): ExteriorLayer[] {
  const s = caseShape(m);
  const b = s.bounds;
  return [{ geometry: surfaceNets(s.sdf, [-b.x, -b.y, b.z[0]], [b.x, b.y, b.z[1]], step), material: 'case' }];
}

// A screw-down display back: a tall polished ring rounding in toward a domed sapphire, hollowed so the rotor clears it.
export function sinnCaseback(m: MovementFrame): ExteriorLayer[] {
  return hollowCaseback({
    radius: P.caseRadius - 0.4, taper: 1.6, seat: caseBack(m), thickness: P.casebackThickness,
    pocket: m.diameterMm / 2 + 0.5,
    // The sapphire bulges out of the ring's face by what the published 17 mm leaves.
    back: { kind: 'display', glass: 1.0, recess: P.crystalTopToStem + P.caseBackFromStem + P.casebackThickness - P.totalThickness },
  });
}
