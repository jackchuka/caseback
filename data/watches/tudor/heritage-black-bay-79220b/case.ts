import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { extrudeProfile, roundedConvex, smax, smin } from '../../../../src/scene/exterior/kit/sdf';
import { surfaceNets } from '../../../../src/scene/exterior/kit/surfaceNets';
import { T } from './params';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// The case middle's front face (the bezel seat). It stands proud of the movement's own front so the crown, which must
// stay on the stem axis, sits lower on the flank; bezel, crystal, flange and caseback all hang off this one plane.
export const caseFront = (m: MovementFrame) => m.frontZ - T.caseFrontOffset;

// The Black Bay's case middle: a 41 mm drum whose lugs are wedges drawn tangent to it, so the case edge runs
// straight out to each lug tip; slab-sided flanks; a brushed top that curves down toward the wrist from the bezel
// edge to the lug tips; and one polished bevel running along the whole top edge.
export function caseShape(m: MovementFrame) {
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
    return bound >= disc + T.lugFillet ? disc : smin(disc, lug(ax, ay), T.lugFillet);
  };
  // 0 at the bezel's edge, 1 at the lug tip, measured along the lug.
  const run = (x: number, y: number) => {
    const edge = Math.sqrt(Math.max(R * R - x * x, 0));
    return clamp01((Math.abs(y) - edge) / (tip - edge));
  };
  const front = (x: number, y: number) => F + T.lugDrop * run(x, y) ** T.lugCurve;
  // The underside lifts only at the very tip, rounding the lug's heel.
  const underside = (y: number) => back - T.lugHeel * clamp01((Math.abs(y) - tip + T.lugHeelRun) / T.lugHeelRun) ** 2;
  const hole = { y: tip - T.holeInset, z: (front(lw + T.lugWidth / 2, tip - T.holeInset) + underside(tip - T.holeInset)) / 2 };
  const opts = { chamfer: T.bevel, backChamfer: T.backChamfer, edge: T.edge };

  let cx = NaN, cy = NaN, cPlan = 0, cFront = 0, cBack = 0, cBore = 0;
  const column = (x: number, y: number) => {
    if (x === cx && y === cy) return;
    cx = x; cy = y; cPlan = plan(x, y); cFront = front(x, y); cBack = underside(y); cBore = T.bore - Math.hypot(x, y);
  };
  // Blind: the photos show plain outer lug flanks.
  const drill = (x: number, y: number, z: number) =>
    Math.min(T.holeRadius - Math.hypot(Math.abs(y) - hole.y, z - hole.z), lw + T.holeDepth - Math.abs(x));
  const sdf = (x: number, y: number, z: number) => {
    column(x, y);
    // Columns well outside the outline or inside the bore need no detail; most of the grid is one of these.
    if (cPlan > 1) return cPlan;
    if (cBore > 1) return cBore;
    // Likewise voxels well in front of or behind the column's faces.
    if (cFront - z > 1) return cFront - z;
    if (z - cBack > 1) return z - cBack;
    const solid = smax(extrudeProfile(cPlan, cFront - z, z - cBack, opts), cBore, T.edge);
    // Only the lug-tip rows can meet the hole.
    return Math.abs(Math.abs(y) - hole.y) > T.holeRadius + 1 ? solid : Math.max(solid, drill(x, y, z));
  };
  // 0 brushed … 1 polished. Each face's finish is weighted by how close its term is to bounding the solid, so the
  // finishes meet along the true crease rather than along grid triangles.
  const polish = (x: number, y: number, z: number) => {
    column(x, y);
    const vf = cFront - z, vb = z - cBack;
    const k: Array<[number, number]> = [
      [0, vf], [0, cBore], [1, cPlan], [1, vb], [1, (cPlan + vf + T.bevel) / Math.SQRT2], [1, (cPlan + vb + T.backChamfer) / Math.SQRT2], [1, drill(x, y, z)],
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
  return { sdf, polish, front, back, hole, bounds: { x: R + 0.5, y: tip + 0.5, z: [F - 0.5, back + 0.5] as [number, number] } };
}

export function tudorCase(m: MovementFrame, step: number): ExteriorLayer[] {
  const s = caseShape(m);
  const b = s.bounds;
  const g = surfaceNets(s.sdf, [-b.x, -b.y, b.z[0]], [b.x, b.y, b.z[1]], step);
  const pos = g.getAttribute('position');
  const polish = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) polish[i] = s.polish(pos.getX(i), pos.getY(i), pos.getZ(i));
  g.setAttribute('polish', new THREE.BufferAttribute(polish, 1));
  return [{ geometry: g, material: 'case' }];
}
