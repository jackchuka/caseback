import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { flipWinding } from '../../../../src/scene/exterior/kit/bend';
import { caseShape } from './case';
import { P } from './params';

const S = P.strap;

// The strap's centre line in the (y, z) plane, by arc length s from the case end: straight on through the spring bar
// along the lug's own fall, then round the wrist. Returns the point and the unit normal toward the outer face.
export function strapPath(m: MovementFrame) {
  const c = caseShape(m);
  const lugX = P.lugGap / 2 + 1.5;
  // The lug's fall over its last few millimetres sets the strap's starting direction.
  const y1 = c.hole.y, y0 = y1 - 2;
  const z1 = (c.front(lugX, y1) + c.underside(lugX, y1)) / 2, z0 = (c.front(lugX, y0) + c.underside(lugX, y0)) / 2;
  const len = Math.hypot(y1 - y0, z1 - z0);
  const d: [number, number] = [(y1 - y0) / len, (z1 - z0) / len];
  // Start where the strap's end meets the case, a little way in from the spring bar along the same line.
  const back = (c.hole.y - (P.caseRadius + 0.35)) / d[0];
  const start: [number, number] = [c.hole.y - back * d[0], c.hole.z - back * d[1]];
  const straight = back + S.straight;
  const a0 = Math.atan2(d[1], d[0]);
  // Turning toward the wrist (+Z, then back toward the watch): the centre of the arc lies on the inner (+Z) side.
  const nIn: [number, number] = [-d[1], d[0]];
  const bendAt: [number, number] = [start[0] + d[0] * straight, start[1] + d[1] * straight];
  const centre: [number, number] = [bendAt[0] + nIn[0] * S.wristRadius, bendAt[1] + nIn[1] * S.wristRadius];
  const at = (s: number) => {
    if (s <= straight) return { p: [start[0] + d[0] * s, start[1] + d[1] * s] as [number, number], n: [-nIn[0], -nIn[1]] as [number, number] };
    const t = (s - straight) / S.wristRadius;
    const a = a0 + t;
    const tan: [number, number] = [Math.cos(a), Math.sin(a)];
    const inward: [number, number] = [-tan[1], tan[0]];
    return { p: [centre[0] - inward[0] * S.wristRadius, centre[1] - inward[1] * S.wristRadius] as [number, number], n: [-inward[0], -inward[1]] as [number, number] };
  };
  return { at, length: straight + S.arc * S.wristRadius, straight, start, dir: d };
}

// A cross-section: flat underside, padded top rounding down to thin edges. (x across, t toward the outer face.)
function section(width: number, thickness: number): Array<[number, number]> {
  const hw = width / 2, n = 8;
  const pts: Array<[number, number]> = [[-hw, 0]];
  for (let i = 0; i <= n; i++) {
    const x = -hw + (2 * hw * i) / n;
    const u = Math.abs(x) / hw;
    pts.push([x, thickness * (1 - S.pad * u ** 4)]);
  }
  pts.push([hw, 0]);
  return pts;
}

// One side's strap, as rows of cross-sections along the path; the first row follows the case's round flank.
function strapSide(m: MovementFrame, dir: 1 | -1): THREE.BufferGeometry {
  const path = strapPath(m);
  const rows = 48;
  const n = section(1, 1).length;
  const positions: number[] = [];
  for (let r = 0; r <= rows; r++) {
    const f = r / rows;
    const s = f * path.length;
    const width = S.startWidth - 0.4 + (S.endWidth - S.startWidth) * f;
    const thick = S.thickness + (S.endThickness - S.thickness) * f;
    for (const [u, v] of section(width, thick)) {
      // The end row reaches back along the path to follow the drum's round flank, so no gap opens at the corners.
      const ss = r === 0 ? (Math.sqrt(Math.max(0, (P.caseRadius + 0.35) ** 2 - u * u)) - path.start[0]) / path.dir[0] : s;
      const { p, n: nn } = path.at(ss);
      positions.push(u, (p[0] + nn[0] * v) * dir, p[1] + nn[1] * v);
    }
  }
  const index: number[] = [];
  for (let r = 0; r < rows; r++)
    for (let i = 0; i < n; i++) {
      const a = r * n + i, b = r * n + ((i + 1) % n), c = (r + 1) * n + ((i + 1) % n), d = (r + 1) * n + i;
      index.push(a, c, b, a, d, c);
    }
  for (const [r, rev] of [[0, false], [rows, true]] as const)
    for (let i = 1; i < n - 1; i++) index.push(...(rev ? [r * n, r * n + i + 1, r * n + i] : [r * n, r * n + i, r * n + i + 1]));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return dir < 0 ? flipWinding(g) : g;
}

// Cream saddle stitching along both edges of each strap, as short dashes just proud of the top face.
function stitches(m: MovementFrame, dir: 1 | -1): THREE.BufferGeometry[] {
  const path = strapPath(m);
  const out: THREE.BufferGeometry[] = [];
  for (let s = 1.5; s < path.length - 1; s += 1.3) {
    const f = s / path.length;
    const width = S.startWidth - 0.4 + (S.endWidth - S.startWidth) * f;
    const thick = S.thickness + (S.endThickness - S.thickness) * f;
    const x = width / 2 - S.stitchInset;
    const v = thick * (1 - S.pad * (x / (width / 2)) ** 4) + 0.02;
    const { p, n } = path.at(s);
    const angle = Math.atan2(n[1], n[0]) - Math.PI / 2;
    for (const sx of [-1, 1]) {
      const g = new THREE.BoxGeometry(0.28, 0.75, 0.12).rotateX(angle).translate(sx * x, p[0] + n[0] * v, p[1] + n[1] * v);
      if (dir < 0) g.scale(1, -1, 1);
      out.push(dir < 0 ? flipWinding(g) : g);
    }
  }
  return out;
}

export function sinnStrap(m: MovementFrame): ExteriorLayer[] {
  const layers: ExteriorLayer[] = [];
  for (const dir of [1, -1] as const) {
    layers.push({ geometry: strapSide(m, dir), material: 'strap', name: 'strap' });
    for (const g of stitches(m, dir)) layers.push({ geometry: g, material: 'stitch' });
  }
  return layers;
}
