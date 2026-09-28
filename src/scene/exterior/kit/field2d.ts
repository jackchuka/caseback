import type { P2 } from './sdf';

// A 2D distance field sampled once on a grid and read back bilinearly. Plan outlines traced from photos have dozens
// of edges; a case SDF evaluates its plan millions of times, so it reads this table instead of walking every edge.
// Outside the grid it falls back to the exact field.
export function sampled2d(f: (x: number, y: number) => number, min: P2, max: P2, step: number) {
  const nx = Math.ceil((max[0] - min[0]) / step) + 1;
  const ny = Math.ceil((max[1] - min[1]) / step) + 1;
  const v = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) v[j * nx + i] = f(min[0] + i * step, min[1] + j * step);
  return (x: number, y: number) => {
    const u = (x - min[0]) / step, w = (y - min[1]) / step;
    if (u < 0 || w < 0 || u >= nx - 1 || w >= ny - 1) return f(x, y);
    const i = Math.floor(u), j = Math.floor(w);
    const s = u - i, t = w - j;
    const k = j * nx + i;
    return (v[k]! * (1 - s) + v[k + 1]! * s) * (1 - t) + (v[k + nx]! * (1 - s) + v[k + nx + 1]! * s) * t;
  };
}
