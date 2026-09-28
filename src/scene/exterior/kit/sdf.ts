export type P2 = [number, number];

export const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
};
export const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

// Signed distance to a convex polygon given counter-clockwise, rounded by `round` (the polygon is inset first,
// so the outline keeps its size).
export function roundedConvex(pts: P2[], round: number) {
  const lines = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length]!;
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const n: P2 = [(q[1] - p[1]) / len, -(q[0] - p[0]) / len];
    return { n, d: n[0] * p[0] + n[1] * p[1] - round };
  });
  const inset: P2[] = lines.map((a, i) => {
    const b = lines[(i + lines.length - 1) % lines.length]!;
    const det = a.n[0] * b.n[1] - a.n[1] * b.n[0];
    return [(a.d * b.n[1] - b.d * a.n[1]) / det, (a.n[0] * b.d - b.n[0] * a.d) / det];
  });
  return (x: number, y: number) => {
    let inside = true;
    let best = Infinity;
    for (let i = 0; i < inset.length; i++) {
      const a = inset[i]!;
      const b = inset[(i + 1) % inset.length]!;
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((x - a[0]) * ex + (y - a[1]) * ey) / (ex * ex + ey * ey)));
      best = Math.min(best, Math.hypot(x - a[0] - ex * t, y - a[1] - ey * t));
      if (ex * (y - a[1]) - ey * (x - a[0]) < 0) inside = false;
    }
    return (inside ? -best : best) - round;
  };
}

// Exact signed distance to any simple polygon, convex or not, in either winding (crossing-number sign).
export function polygonSdf(pts: P2[]) {
  return (x: number, y: number) => {
    let d = Infinity;
    let s = 1;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [ax, ay] = pts[i]!;
      const [bx, by] = pts[j]!;
      const ex = bx - ax, ey = by - ay;
      const wx = x - ax, wy = y - ay;
      const t = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey)));
      d = Math.min(d, Math.hypot(wx - ex * t, wy - ey * t));
      const c1 = y >= ay, c2 = y < by, c3 = ex * wy > ey * wx;
      if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * d;
  };
}

export type ExtrudeOptions = { chamfer: number; backChamfer: number; edge: number };

// A solid bounded by an outline (distance p), a front face (vf = front − z) and a back face (vb = z − back), with
// 45° bevels along both outer edges and every crease rounded by `edge`. Callers that cache per-column values pass
// the distances directly.
export function extrudeProfile(p: number, vf: number, vb: number, o: ExtrudeOptions) {
  const e = o.edge;
  return smax(smax(smax(smax(p, vf, e), vb, e), (p + vf + o.chamfer) / Math.SQRT2, e), (p + vb + o.backChamfer) / Math.SQRT2, e);
}

export function extrudePlan(plan: (x: number, y: number) => number, o: ExtrudeOptions & { front: number; back: number }) {
  return (x: number, y: number, z: number) => extrudeProfile(plan(x, y), o.front - z, z - o.back, o);
}
