import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { extrudeProfile, roundedConvex, smax, smin } from '../../../../src/scene/exterior/kit/sdf';
import { surfaceNets } from '../../../../src/scene/exterior/kit/surfaceNets';
import { T } from './params';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// The Black Bay's case middle: a 41 mm drum with four straight, untapered lugs fused on, slab-sided flanks, a flat
// brushed top that dips toward the wrist only at the lug tips, and one polished bevel running along the whole top edge.
export function caseShape(m: MovementFrame) {
  const R = T.caseRadius;
  const lw = T.lugGap / 2;
  const tip = T.lugToLug / 2;
  const back = m.frontZ + T.caseHeight;
  const lug = roundedConvex([[lw, 0], [lw + T.lugWidth, 0], [lw + T.lugWidth, tip], [lw, tip]], T.lugTipRound);
  const plan = (x: number, y: number) => {
    const disc = Math.hypot(x, y) - R;
    const ax = Math.abs(x), ay = Math.abs(y);
    // The lug's bounding box bounds its distance; beyond the blend it cannot change the result.
    const bx = Math.max(lw - ax, ax - lw - T.lugWidth, 0), by = Math.max(ay - tip, 0);
    return Math.hypot(bx, by) >= disc + T.lugFillet ? disc : smin(disc, lug(ax, ay), T.lugFillet);
  };
  const front = (y: number) => m.frontZ + T.lugDrop * clamp01((Math.abs(y) - (tip - T.lugDropRun)) / T.lugDropRun) ** 2;
  const hole = { y: tip - T.holeInset, z: (front(tip - T.holeInset) + back) / 2 };
  const opts = { chamfer: T.bevel, backChamfer: T.backChamfer, edge: T.edge };

  let cx = NaN, cy = NaN, cPlan = 0, cFront = 0, cBore = 0;
  const column = (x: number, y: number) => {
    if (x === cx && y === cy) return;
    cx = x; cy = y; cPlan = plan(x, y); cFront = front(y); cBore = T.bore - Math.hypot(x, y);
  };
  const drill = (y: number, z: number) => T.holeRadius - Math.hypot(Math.abs(y) - hole.y, z - hole.z);
  const sdf = (x: number, y: number, z: number) => {
    column(x, y);
    // Columns well outside the outline or inside the bore need no detail; most of the grid is one of these.
    if (cPlan > 1) return cPlan;
    if (cBore > 1) return cBore;
    const solid = extrudeProfile(cPlan, cFront - z, z - back, opts);
    return Math.max(smax(solid, cBore, T.edge), drill(y, z));
  };
  // 0 brushed … 1 polished. Each face's finish is weighted by how close its term is to bounding the solid, so the
  // finishes meet along the true crease rather than along grid triangles.
  const polish = (x: number, y: number, z: number) => {
    column(x, y);
    const vf = cFront - z, vb = z - back;
    const k: Array<[number, number]> = [
      [0, vf], [0, cBore], [1, cPlan], [1, vb], [1, (cPlan + vf + T.bevel) / Math.SQRT2], [1, (cPlan + vb + T.backChamfer) / Math.SQRT2], [1, drill(y, z)],
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
  return { sdf, polish, front, back, hole, bounds: { x: R + 0.5, y: tip + 0.5, z: [m.frontZ - 0.5, back + 0.5] as [number, number] } };
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
