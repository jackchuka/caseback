export type P2 = { x: number; y: number };

export const pitchRadius = (teeth: number, module: number) => (teeth * module) / 2;

export const centerDistance = (module: number, z1: number, z2: number) => (module * (z1 + z2)) / 2;

export const place = (from: P2, distance: number, deg: number): P2 => ({
  x: from.x + distance * Math.cos((deg * Math.PI) / 180),
  y: from.y + distance * Math.sin((deg * Math.PI) / 180),
});

export const offset = (p: P2, dx: number, dy: number): P2 => ({ x: p.x + dx, y: p.y + dy });

export const at = (p: P2, z: number) => ({ x: p.x, y: p.y, z });

export const smoothstep = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

export function circleIntersection(a: P2, ra: number, b: P2, rb: number, pick: 1 | -1): P2 {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  const l = (ra * ra - rb * rb + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, ra * ra - l * l));
  const ux = (b.x - a.x) / d;
  const uy = (b.y - a.y) / d;
  return { x: a.x + ux * l - pick * uy * h, y: a.y + uy * l + pick * ux * h };
}
