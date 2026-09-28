import * as THREE from 'three';
import type { LegacyConfig } from './config';
import type { Layer } from '../../../geometry/parts';
import type { CaseRadii } from './radii';
import { surfaceNets } from '../kit/surfaceNets';
import { extrudeProfile, roundedConvex, smax, smin } from '../kit/sdf';

// Fractions of the case-middle height: how far the lug tips sweep toward the wrist, and how much the lug
// underside lifts off the wrist line toward the tip (Hamilton side photo; Tudor and Sinn are close).
const DROP = 0.45;
const RISE = 0.1;
// Radius of the concave blend where the lugs grow out of the round case (top view), and of the rounded lug-tip corners.
const FILLET = 3.2;
const TIP_CORNER = 0.8;
// Real case edges are softened by finishing; the same radius keeps grid-sampled creases from aliasing.
const EDGE = 0.3;
const BACK_CHAMFER = 0.3;
const FLANK_SLOPE = 0.6;
const HOLE_RADIUS = 0.55;

// The case middle as one solid, the way it is forged and machined: a round body and four lugs fused by concave
// fillets, a flat top that runs out along the lugs and sweeps down toward the wrist, a polished bevel along the
// top edge, and the movement bore through the middle. Everything is symmetric about both axes.
export function caseShape(e: LegacyConfig, r: CaseRadii) {
  const R = r.outer;
  const lw = e.case.lugWidthMm / 2;
  const W = e.case.lugs.widthMm;
  const tip = e.case.lugToLugMm / 2;
  const top = r.bottom + r.height;
  const lug = roundedConvex([[lw, 0], [lw + W, 0], [lw + W * e.case.lugs.taper, tip], [lw, tip]], TIP_CORNER);
  const edgeY = (x: number) => Math.sqrt(Math.max(0, R * R - Math.min(x, R) ** 2));
  const run = tip - edgeY(lw + W / 2);
  // How far along the lug a point is, measured from the round case edge, so the case itself stays flat. Only the
  // 12 and 6 o'clock sides carry lugs; the 3 and 9 o'clock flanks (and crown guards) keep the full height.
  const lugSide = (y: number) => {
    const t = Math.min(1, Math.max(0, (Math.abs(y) - R * 0.45) / (R * 0.2)));
    return t * t * (3 - 2 * t);
  };
  const along = (x: number, y: number) => lugSide(y) * Math.min(1, Math.max(0, (Math.abs(y) - edgeY(Math.abs(x))) / run));
  const front = (x: number, y: number) => r.bottom + DROP * r.height * along(x, y) ** 1.7;
  const back = (x: number, y: number) => top - RISE * r.height * along(x, y) ** 2;
  const midZ = (x: number, y: number) => (front(x, y) + back(x, y)) / 2;
  const lugBox = { x0: lw, x1: lw + W, y1: tip };
  const cr = e.crown.diameterMm / 2;
  const guardReach = e.crown.lengthMm * 0.75;
  // Crown guards: shoulders either side of the crown at 3 o'clock, tapering outward, fused to the case like the lugs.
  const guard = e.crown.guards
    ? roundedConvex([[R - 3, cr + 0.4], [R + guardReach, cr + 0.4], [R + guardReach, cr + 2.2], [R - 3, cr + 3.2]], 0.6)
    : null;
  const plan = (x: number, y: number) => {
    const body = lugsAndCase(x, y);
    return guard && x > R - 4 ? smin(body, guard(x, Math.abs(y)), FILLET * 0.6) : body;
  };
  const lugsAndCase = (x: number, y: number) => {
    const disc = Math.hypot(x, y) - R;
    const ax = Math.abs(x), ay = Math.abs(y);
    // The lug's bounding box is a lower bound on its distance; when that is beyond the blend, the lug cannot matter.
    const bx = Math.max(lugBox.x0 - ax, ax - lugBox.x1, 0), by = Math.max(ay - lugBox.y1, 0);
    if (Math.hypot(bx, by) >= disc + FILLET) return disc;
    return smin(disc, lug(ax, ay), FILLET);
  };
  const hole = { y: tip - 1.8, z: midZ(lw + W / 2, tip - 1.8) };
  const slope = e.case.flank === 'sloped' ? FLANK_SLOPE : 0;

  let cx = NaN, cy = NaN, cPlan = 0, cFront = 0, cBack = 0, cSlope = 0, cBore = 0;
  const column = (x: number, y: number) => {
    if (x === cx && y === cy) return;
    cx = x; cy = y; cPlan = plan(x, y); cFront = front(x, y); cBack = back(x, y);
    cBore = r.inner - Math.hypot(x, y);
    // Only the round flank slopes; the lugs keep square faces so the strap sits flush.
    cSlope = slope * Math.max(0, 1 - 3 * along(x, y));
  };
  // A sloped flank narrows toward the caseback, pivoting at mid-height.
  const flank = (z: number) => cPlan + cSlope * (Math.min(1, Math.max(0, (z - cFront) / (cBack - cFront))) - 0.5);
  const drill = (y: number, z: number) => (e.case.lugs.drilled ? HOLE_RADIUS - Math.hypot(Math.abs(y) - hole.y, z - hole.z) : -Infinity);
  const sdf = (x: number, y: number, z: number) => {
    column(x, y);
    // Columns well outside the outline or inside the movement bore need no detail; most of the grid is one of these.
    if (cPlan > 1) return cPlan;
    if (cBore > 1) return cBore;
    const p = flank(z);
    const vf = cFront - z;
    const vb = z - cBack;
    const solid = extrudeProfile(p, vf, vb, { chamfer: e.case.chamferMm, backChamfer: BACK_CHAMFER, edge: EDGE });
    return Math.max(smax(solid, cBore, EDGE), drill(y, z));
  };
  // How polished a surface point is (0 brushed … 1 polished). Each face's finish is weighted by how close its term
  // is to bounding the solid there, so finishes meet along the true crease instead of along grid triangles.
  const polish = (x: number, y: number, z: number) => {
    column(x, y);
    const p = flank(z);
    const vf = cFront - z;
    const vb = z - cBack;
    const top = e.case.finish.top === 'polished' ? 1 : 0;
    const side = e.case.finish.flank === 'polished' ? 1 : 0;
    const k: Array<[number, number]> = [[top, vf], [top, cBore], [side, p], [side, vb], [1, (p + vf + e.case.chamferMm) / Math.SQRT2], [side, (p + vb + BACK_CHAMFER) / Math.SQRT2], [1, drill(y, z)]];
    const m = Math.max(...k.map(([, t]) => t));
    let sum = 0, weight = 0;
    for (const [f, t] of k) {
      const w = Math.exp((t - m) / 0.04);
      sum += f * w;
      weight += w;
    }
    return sum / weight;
  };
  return { sdf, polish, front, back, midZ, hole, bounds: { x: R + (guard ? guardReach : 0) + 0.5, y: tip + 0.5, z: [r.bottom - 0.5, top + 0.5] as [number, number] } };
}

export function springBar(e: LegacyConfig, r: CaseRadii) {
  return caseShape(e, r).hole;
}

export function caseBody(e: LegacyConfig, r: CaseRadii, step = 0.2): Layer[] {
  const s = caseShape(e, r);
  const b = s.bounds;
  const g = surfaceNets(s.sdf, [-b.x, -b.y, b.z[0]], [b.x, b.y, b.z[1]], step);
  const pos = g.getAttribute('position');
  const polish = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) polish[i] = s.polish(pos.getX(i), pos.getY(i), pos.getZ(i));
  g.setAttribute('polish', new THREE.BufferAttribute(polish, 1));
  return [{ geometry: g, material: 'case' }];
}
