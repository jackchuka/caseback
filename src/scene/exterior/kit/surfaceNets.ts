import * as THREE from 'three';
import type { ExteriorContext } from '../contract';

export type Sdf = (x: number, y: number, z: number) => number;

// The grid step a case's surface nets run at, in mm, for the build's quality.
export const caseStep = (quality: ExteriorContext['quality']) => (quality === 'high' ? 0.2 : 0.3);
type V3 = [number, number, number];

const CORNERS: V3[] = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
const EDGES: Array<[number, number]> = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];

function gradient(f: Sdf, x: number, y: number, z: number, e: number): V3 {
  return [f(x + e, y, z) - f(x - e, y, z), f(x, y + e, z) - f(x, y - e, z), f(x, y, z + e) - f(x, y, z - e)];
}

// Surface Nets (Gibson 1998): one vertex per grid cell that the surface crosses, one quad per crossed grid edge.
// Each vertex is then pulled onto the zero level along the gradient, so creases stay close to the true surface.
// `f` is sampled with z varying fastest, which lets callers cache per-(x, y) work.
export function surfaceNets(f: Sdf, min: V3, max: V3, step: number): THREE.BufferGeometry {
  const n = [0, 1, 2].map((a) => Math.ceil((max[a]! - min[a]!) / step) + 1) as V3;
  const [nx, ny, nz] = n;
  const at = (i: number, j: number, k: number) => (i * ny + j) * nz + k;
  const values = new Float32Array(nx * ny * nz);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) values[at(i, j, k)] = f(min[0] + i * step, min[1] + j * step, min[2] + k * step);

  const offsets = CORNERS.map(([a, b, c]) => (a * ny + b) * nz + c);
  const cell = new Int32Array(nx * ny * nz).fill(-1);
  const positions: number[] = [];
  const normals: number[] = [];
  const e = step * 0.05;
  for (let i = 0; i < nx - 1; i++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let k = 0; k < nz - 1; k++) {
        const base = at(i, j, k);
        const first = values[base]! < 0;
        let mixed = false;
        for (let c = 1; c < 8 && !mixed; c++) mixed = values[base + offsets[c]!]! < 0 !== first;
        if (!mixed) continue;
        const v = offsets.map((o) => values[base + o]!);
        let x = 0, y = 0, z = 0, count = 0;
        for (const [p, q] of EDGES) {
          const vp = v[p]!, vq = v[q]!;
          if (vp < 0 === vq < 0) continue;
          const t = vp / (vp - vq);
          const [ap, bp, cp] = CORNERS[p]!;
          const [aq, bq, cq] = CORNERS[q]!;
          x += ap + (aq - ap) * t; y += bp + (bq - bp) * t; z += cp + (cq - cp) * t;
          count++;
        }
        let px = min[0] + (i + x / count) * step;
        let py = min[1] + (j + y / count) * step;
        let pz = min[2] + (k + z / count) * step;
        let g = gradient(f, px, py, pz, e);
        for (let it = 0; it < 3; it++) {
          const len2 = g[0] ** 2 + g[1] ** 2 + g[2] ** 2;
          if (len2 < 1e-12) break;
          const s = (f(px, py, pz) * 2 * e) / len2;
          // Stay inside the cell's neighbourhood so a crease cannot fling a vertex across the grid.
          px -= Math.max(-step, Math.min(step, s * g[0]));
          py -= Math.max(-step, Math.min(step, s * g[1]));
          pz -= Math.max(-step, Math.min(step, s * g[2]));
          g = gradient(f, px, py, pz, e);
        }
        const len = Math.hypot(...g) || 1;
        cell[at(i, j, k)] = positions.length / 3;
        positions.push(px, py, pz);
        normals.push(g[0] / len, g[1] / len, g[2] / len);
      }
    }
  }

  const inside = new Uint8Array(values.length);
  for (let i = 0; i < values.length; i++) inside[i] = values[i]! < 0 ? 1 : 0;
  const index: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, outward: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (outward) index.push(a, b, c, a, c, d);
    else index.push(a, c, b, a, d, c);
  };
  const sx = ny * nz, sy = nz;
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      for (let k = 0; k < nz; k++) {
        const o = i * sx + j * sy + k;
        const v0 = inside[o]!;
        // Winding follows the right-hand rule around the edge's axis: y×z = x, z×x = y, x×y = z.
        if (i < nx - 1 && j > 0 && k > 0 && v0 !== inside[o + sx]) quad(cell[o - sy - 1]!, cell[o - 1]!, cell[o]!, cell[o - sy]!, v0 === 1);
        if (j < ny - 1 && i > 0 && k > 0 && v0 !== inside[o + sy]) quad(cell[o - sx - 1]!, cell[o - sx]!, cell[o]!, cell[o - 1]!, v0 === 1);
        if (k < nz - 1 && i > 0 && j > 0 && v0 !== inside[o + 1]) quad(cell[o - sx - sy]!, cell[o - sy]!, cell[o]!, cell[o - sx]!, v0 === 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setIndex(positions.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(index, 1) : new THREE.Uint16BufferAttribute(index, 1));
  return g;
}

// A surface-nets mesh over [min, max] carrying a per-vertex `polish` attribute read from `polish`.
export function polishedMesh(f: Sdf, polish: Sdf, min: V3, max: V3, step: number): THREE.BufferGeometry {
  const g = surfaceNets(f, min, max, step);
  const pos = g.getAttribute('position');
  const p = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) p[i] = polish(pos.getX(i), pos.getY(i), pos.getZ(i));
  g.setAttribute('polish', new THREE.BufferAttribute(p, 1));
  return g;
}
