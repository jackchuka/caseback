import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { extrudeProfile, polygonSdf, smax, smin, type P2 } from '../../../../src/scene/exterior/kit/sdf';
import { surfaceNets } from '../../../../src/scene/exterior/kit/surfaceNets';
import { H } from './params';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

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
  // 0 at the drum's edge, 1 at the lug tip, measured along the lug.
  const run = (x: number, y: number) => {
    const edge = Math.sqrt(Math.max(R * R - x * x, 0));
    return clamp01((Math.abs(y) - edge) / (tip - edge));
  };
  const front = (x: number, y: number) => F + H.lugDrop * run(x, y) ** H.lugCurve;
  const underside = (y: number) => back - H.lugHeel * clamp01((Math.abs(y) - tip + H.lugHeelRun) / H.lugHeelRun) ** 2;
  const hole = { y: tip - H.holeInset, z: (front(lw + 1, tip - H.holeInset) + underside(tip - H.holeInset)) / 2 };
  const opts = { chamfer: H.bevel, backChamfer: H.backChamfer, edge: H.edge };

  let cx = NaN, cy = NaN, cPlan = 0, cFront = 0, cBack = 0, cBore = 0;
  const column = (x: number, y: number) => {
    if (x === cx && y === cy) return;
    cx = x; cy = y; cPlan = plan(x, y); cFront = front(x, y); cBack = underside(y); cBore = H.bore - Math.hypot(x, y);
  };
  const drill = (x: number, y: number, z: number) =>
    Math.min(H.holeRadius - Math.hypot(Math.abs(y) - hole.y, z - hole.z), lw + H.holeDepth - Math.abs(x));
  const sdf = (x: number, y: number, z: number) => {
    column(x, y);
    if (cPlan > 1) return cPlan;
    if (cBore > 1) return cBore;
    if (cFront - z > 1) return cFront - z;
    if (z - cBack > 1) return z - cBack;
    if (counter) counter.full++;
    const solid = smax(extrudeProfile(cPlan, cFront - z, z - cBack, opts), cBore, H.edge);
    return Math.abs(Math.abs(y) - hole.y) > H.holeRadius + 1 ? solid : Math.max(solid, drill(x, y, z));
  };
  // 0 brushed … 1 polished: only the front bevel is polished; top, flank, back and bore are brushed.
  const polish = (x: number, y: number, z: number) => {
    column(x, y);
    const vf = cFront - z, vb = z - cBack;
    const k: Array<[number, number]> = [
      [0, vf], [0, cBore], [0, cPlan], [0, vb], [1, (cPlan + vf + H.bevel) / Math.SQRT2], [0, (cPlan + vb + H.backChamfer) / Math.SQRT2], [0, drill(x, y, z)],
    ];
    const top = Math.max(...k.map(([, t]) => t));
    let sum = 0, weight = 0;
    for (const [f, t] of k) {
      const w = Math.exp((t - top) / 0.04);
      sum += f * w;
      weight += w;
    }
    return sum / weight;
  };
  return { sdf, plan, polish, front, back, hole, bounds: { x: R + 0.5, y: tip + 0.5, z: [F - 0.5, back + 0.5] as [number, number] } };
}

export function hamiltonCase(m: MovementFrame, step: number): ExteriorLayer[] {
  const s = caseShape(m);
  const b = s.bounds;
  const g = surfaceNets(s.sdf, [-b.x, -b.y, b.z[0]], [b.x, b.y, b.z[1]], step);
  const pos = g.getAttribute('position');
  const polish = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) polish[i] = s.polish(pos.getX(i), pos.getY(i), pos.getZ(i));
  g.setAttribute('polish', new THREE.BufferAttribute(polish, 1));
  return [{ geometry: g, material: 'case' }];
}
