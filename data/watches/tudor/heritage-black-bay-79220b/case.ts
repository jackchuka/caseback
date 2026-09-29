import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { hollowCaseback } from '../../../../src/scene/exterior/kit/caseback';
import { softFinish } from '../../../../src/scene/exterior/kit/polish';
import { caseColumn, clamp01, extrudeProfile, lugRun, roundedConvex, smax, smin } from '../../../../src/scene/exterior/kit/sdf';
import { polishedMesh } from '../../../../src/scene/exterior/kit/surfaceNets';
import { T } from './params';

// The case middle's front face (the bezel seat). It stands proud of the movement's own front so the crown, which must
// stay on the stem axis, sits lower on the flank; bezel, crystal, flange and caseback all hang off this one plane.
export const caseFront = (m: MovementFrame) => m.frontZ - T.caseFrontOffset;

// The Black Bay's case middle: a 41 mm drum whose lugs are wedges drawn tangent to it, so the case edge runs
// straight out to each lug tip; slab-sided flanks; a brushed top that curves down toward the wrist from the bezel
// edge to the lug tips; and one polished bevel running along the whole top edge.
// `counter`, when given, counts the evaluations that get past the cheap early exits: the build's real work.
export function caseShape(m: MovementFrame, counter?: { full: number }) {
  const R = T.caseRadius;
  const lw = T.lugGap / 2;
  const tip = T.lugToLug / 2;
  const F = caseFront(m);
  const back = F + T.caseHeight;
  const xo = lw + T.lugWidth;
  // The lug's outer edge leaves the drum on its tangent through the tip's outer corner.
  const phi = Math.atan2(tip, xo) - Math.acos(R / Math.hypot(xo, tip));
  const tx = R * Math.cos(phi), ty = R * Math.sin(phi);
  const lug = roundedConvex([[lw, 0], [tx, ty], [xo, tip], [lw, tip]], T.lugTipRound);
  // Outward normal of the lug's outer edge, from T to the tip corner.
  const ol = Math.hypot(xo - tx, tip - ty), onx = (tip - ty) / ol, ony = (tx - xo) / ol, oc = onx * tx + ony * ty;
  const plan = (x: number, y: number) => {
    const disc = Math.hypot(x, y) - R;
    // Deep inside the drum only the sign matters.
    if (disc < -2) return disc;
    const ax = Math.abs(x), ay = Math.abs(y);
    // The lug's edge lines bound its distance from below; beyond the blend the lug cannot change the result.
    const bound = Math.max(lw - ax, onx * ax + ony * ay - oc, ay - tip);
    if (bound >= disc + T.lugFillet) return disc;
    // Along the flank the drum and the lug's outer edge already meet on a tangent, where a blend would bulge the
    // outline; only the inner corner under the end link gets the fillet.
    return ax < lw + 2 * T.lugFillet ? smin(disc, lug(ax, ay), T.lugFillet) : Math.min(disc, lug(ax, ay));
  };
  const run = lugRun(R, tip);
  const front = (x: number, y: number) => F + T.lugDrop * run(x, y) ** T.lugCurve;
  // The underside lifts only at the very tip, rounding the lug's heel.
  const underside = (y: number) => back - T.lugHeel * clamp01((Math.abs(y) - tip + T.lugHeelRun) / T.lugHeelRun) ** 2;
  const hole = { y: tip - T.holeInset, z: (front(lw + T.lugWidth / 2, tip - T.holeInset) + underside(tip - T.holeInset)) / 2 };
  const opts = { chamfer: T.bevel, backChamfer: T.backChamfer, edge: T.edge };

  const column = caseColumn(plan, front, (_x, y) => underside(y), T.bore);
  // Blind: the photos show plain outer lug flanks.
  const drill = (x: number, y: number, z: number) =>
    Math.min(T.holeRadius - Math.hypot(Math.abs(y) - hole.y, z - hole.z), lw + T.holeDepth - Math.abs(x));
  const sdf = (x: number, y: number, z: number) => {
    const c = column(x, y);
    // Columns well outside the outline or inside the bore need no detail; most of the grid is one of these.
    if (c.plan > 1) return c.plan;
    if (c.bore > 1) return c.bore;
    // Likewise voxels well in front of or behind the column's faces.
    if (c.front - z > 1) return c.front - z;
    if (z - c.back > 1) return z - c.back;
    if (counter) counter.full++;
    const solid = smax(extrudeProfile(c.plan, c.front - z, z - c.back, opts), c.bore, T.edge);
    // Only the lug-tip rows can meet the hole.
    return Math.abs(Math.abs(y) - hole.y) > T.holeRadius + 1 ? solid : Math.max(solid, drill(x, y, z));
  };
  // 0 brushed … 1 polished.
  const polish = (x: number, y: number, z: number) => {
    const c = column(x, y);
    const vf = c.front - z, vb = z - c.back;
    return softFinish([
      [0, vf], [0, c.bore], [1, c.plan], [1, vb], [1, (c.plan + vf + T.bevel) / Math.SQRT2], [1, (c.plan + vb + T.backChamfer) / Math.SQRT2], [1, drill(x, y, z)],
    ]);
  };
  return { sdf, polish, front, back, hole, bounds: { x: R + 0.5, y: tip + 0.5, z: [F - 0.5, back + 0.5] as [number, number] } };
}

export function tudorCase(m: MovementFrame, step: number): ExteriorLayer[] {
  const s = caseShape(m);
  const b = s.bounds;
  return [{ geometry: polishedMesh(s.sdf, s.polish, [-b.x, -b.y, b.z[0]], [b.x, b.y, b.z[1]], step), material: 'case' }];
}

// Hollowed so the rotor clears it; its flank keeps the kit caseback's taper.
export function tudorCaseback(m: MovementFrame): ExteriorLayer[] {
  return hollowCaseback({
    radius: T.caseRadius - 0.8, taper: 0.3, seat: caseFront(m) + T.caseHeight, thickness: T.casebackThickness,
    pocket: m.diameterMm / 2 + T.casebackPocketClearance, back: { kind: 'solid', plate: T.casebackPlate },
  });
}
