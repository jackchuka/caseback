import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { softFinish } from '../../../../src/scene/exterior/kit/polish';
import { caseColumn, clamp01, extrudeProfile, lugRun, polygonSdf, smax, smin, type P2 } from '../../../../src/scene/exterior/kit/sdf';
import { polishedMesh } from '../../../../src/scene/exterior/kit/surfaceNets';
import { H } from './params';

// The case middle's front face (the bezel seat); bezel, crystal, flange and caseback all hang off this plane.
export const caseFront = (m: MovementFrame) => m.frontZ - H.caseFrontOffset;
export const caseBack = (m: MovementFrame) => caseFront(m) + H.caseHeight;

// Outer edge of the lug at height y (|y| from lugLeave to the tip): it leaves the drum almost on its tangent and
// converges on the tip, so the lugs read as long, gently tapering horns rather than wedges.
export function lugOuter(y: number) {
  const tip = H.lugToLug / 2;
  const x0 = Math.sqrt(H.caseRadius ** 2 - H.lugLeave ** 2);
  const t = clamp01((tip - y) / (tip - H.lugLeave));
  return H.lugTip + (x0 - H.lugTip) * t ** H.lugPower;
}

// The lug's plan in the first quadrant: its inner edge on the lug gap, its outer edge on lugOuter, its root reaching
// inside the drum so the union has no seam.
function lugPolygon(): P2[] {
  const lw = H.lugGap / 2, tip = H.lugToLug / 2;
  // Any root well inside the drum works: at |y| = 6 and 0.6 mm in from the drum edge, the root is buried in the case.
  const root = 6;
  const pts: P2[] = [[lw, root], [Math.sqrt(H.caseRadius ** 2 - root ** 2) - 0.6, root]];
  const end = tip - H.lugTipRound;
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const y = H.lugLeave + ((end - H.lugLeave) * i) / n;
    pts.push([lugOuter(y), y]);
  }
  // The tip's outer corner, softened by a short chamfer that the voxel grid rounds off.
  pts.push([lugOuter(tip) - 0.6 * H.lugTipRound, tip], [lw, tip]);
  return pts;
}

// The Khaki Field's case middle: a 38 mm drum with long horns, slab-sided brushed flanks, a brushed top that dips
// toward the wrist along the lugs, and a narrow polished bevel between top and flank.
// `counter`, when given, counts the evaluations that get past the cheap early exits.
export function caseShape(m: MovementFrame, counter?: { full: number }) {
  const R = H.caseRadius;
  const lw = H.lugGap / 2;
  const tip = H.lugToLug / 2;
  const F = caseFront(m);
  const back = caseBack(m);
  const lug = polygonSdf(lugPolygon());
  const plan = (x: number, y: number) => {
    const disc = Math.hypot(x, y) - R;
    if (disc < -2) return disc;
    const ax = Math.abs(x), ay = Math.abs(y);
    // Cheap bound: beyond the lug's bounding box the lug cannot change the result.
    const box = Math.max(lw - ax, ax - (R + 0.1), ay - tip);
    if (box >= disc + H.lugFillet) return disc;
    // Along the flank the curve joins the drum on its tangent; only the inner corner under the strap gets a fillet.
    const l = lug(ax, ay);
    return ax < lw + 2 * H.lugFillet ? smin(disc, l, H.lugFillet) : Math.min(disc, l);
  };
  const run = lugRun(R, tip);
  const front = (x: number, y: number) => F + H.lugDrop * run(x, y) ** H.lugCurve;
  const underside = (y: number) => back - H.lugHeel * clamp01((Math.abs(y) - tip + H.lugHeelRun) / H.lugHeelRun) ** 2;
  const hole = { y: tip - H.holeInset, z: (front(lw + 1, tip - H.holeInset) + underside(tip - H.holeInset)) / 2 };
  const opts = { chamfer: H.bevel, backChamfer: H.backChamfer, edge: H.edge };

  const column = caseColumn(plan, front, (_x, y) => underside(y), H.bore);
  const drill = (x: number, y: number, z: number) =>
    Math.min(H.holeRadius - Math.hypot(Math.abs(y) - hole.y, z - hole.z), lw + H.holeDepth - Math.abs(x));
  const sdf = (x: number, y: number, z: number) => {
    const c = column(x, y);
    if (c.plan > 1) return c.plan;
    if (c.bore > 1) return c.bore;
    if (c.front - z > 1) return c.front - z;
    if (z - c.back > 1) return z - c.back;
    if (counter) counter.full++;
    const solid = smax(extrudeProfile(c.plan, c.front - z, z - c.back, opts), c.bore, H.edge);
    return Math.abs(Math.abs(y) - hole.y) > H.holeRadius + 1 ? solid : Math.max(solid, drill(x, y, z));
  };
  // 0 brushed … 1 polished: only the front bevel is polished; top, flank, back and bore are brushed.
  const polish = (x: number, y: number, z: number) => {
    const c = column(x, y);
    const vf = c.front - z, vb = z - c.back;
    return softFinish([
      [0, vf], [0, c.bore], [0, c.plan], [0, vb], [1, (c.plan + vf + H.bevel) / Math.SQRT2], [0, (c.plan + vb + H.backChamfer) / Math.SQRT2], [0, drill(x, y, z)],
    ]);
  };
  return { sdf, plan, polish, front, back, hole, bounds: { x: R + 0.5, y: tip + 0.5, z: [F - 0.5, back + 0.5] as [number, number] } };
}

export function hamiltonCase(m: MovementFrame, step: number): ExteriorLayer[] {
  const s = caseShape(m);
  const b = s.bounds;
  return [{ geometry: polishedMesh(s.sdf, s.polish, [-b.x, -b.y, b.z[0]], [b.x, b.y, b.z[1]], step), material: 'case' }];
}
