import * as THREE from 'three';
import type { P2 } from './sdf';

// The zero contour of a 2D signed distance field as a counter-clockwise shape (marching squares). Only the
// largest loop is kept; the field must be positive along the sampling bounds.
export function outlineShape(sdf: (x: number, y: number) => number, min: P2, max: P2, step: number): THREE.Shape {
  const nx = Math.ceil((max[0] - min[0]) / step);
  const ny = Math.ceil((max[1] - min[1]) / step);
  const v = new Float64Array((nx + 1) * (ny + 1));
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) v[j * (nx + 1) + i] = sdf(min[0] + i * step, min[1] + j * step);
  const at = (i: number, j: number) => v[j * (nx + 1) + i]!;

  const points = new Map<string, P2>();
  const links = new Map<string, string[]>();
  const edge = (i0: number, j0: number, i1: number, j1: number) => {
    const key = `${i0},${j0},${i1},${j1}`;
    if (!points.has(key)) {
      const a = at(i0, j0), b = at(i1, j1);
      const t = a / (a - b);
      points.set(key, [min[0] + (i0 + (i1 - i0) * t) * step, min[1] + (j0 + (j1 - j0) * t) * step]);
    }
    return key;
  };
  const link = (a: string, b: string) => {
    links.set(a, [...(links.get(a) ?? []), b]);
    links.set(b, [...(links.get(b) ?? []), a]);
  };

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const c00 = at(i, j) < 0, c10 = at(i + 1, j) < 0, c11 = at(i + 1, j + 1) < 0, c01 = at(i, j + 1) < 0;
      const crossings: string[] = [];
      if (c00 !== c10) crossings.push(edge(i, j, i + 1, j));
      if (c10 !== c11) crossings.push(edge(i + 1, j, i + 1, j + 1));
      if (c01 !== c11) crossings.push(edge(i, j + 1, i + 1, j + 1));
      if (c00 !== c01) crossings.push(edge(i, j, i, j + 1));
      if (crossings.length === 2) link(crossings[0]!, crossings[1]!);
      else if (crossings.length === 4) {
        // Saddle: order is bottom, right, top, left. The centre decides which diagonal is connected.
        const [b, r, t, l] = crossings as [string, string, string, string];
        const centreInside = (at(i, j) + at(i + 1, j) + at(i + 1, j + 1) + at(i, j + 1)) / 4 < 0;
        if (centreInside === c00) { link(b, r); link(t, l); } else { link(b, l); link(r, t); }
      }
    }
  }

  const seen = new Set<string>();
  let best: P2[] = [];
  let bestArea = 0;
  for (const start of links.keys()) {
    if (seen.has(start)) continue;
    const loop: P2[] = [];
    let prev = '';
    let cur = start;
    while (!seen.has(cur)) {
      seen.add(cur);
      loop.push(points.get(cur)!);
      const next = links.get(cur)!.find((n) => n !== prev && !seen.has(n)) ?? links.get(cur)!.find((n) => n !== prev)!;
      prev = cur;
      cur = next;
    }
    const a = THREE.ShapeUtils.area(loop.map(([x, y]) => new THREE.Vector2(x, y)));
    if (Math.abs(a) > Math.abs(bestArea)) { best = loop; bestArea = a; }
  }
  if (bestArea < 0) best.reverse();
  return new THREE.Shape(best.map(([x, y]) => new THREE.Vector2(x, y)));
}
