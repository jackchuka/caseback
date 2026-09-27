export type P2 = { x: number; y: number };

export const pitchRadius = (teeth: number, module: number) => (teeth * module) / 2;

export const centerDistance = (module: number, z1: number, z2: number) => (module * (z1 + z2)) / 2;

export const place = (from: P2, distance: number, deg: number): P2 => ({
  x: from.x + distance * Math.cos((deg * Math.PI) / 180),
  y: from.y + distance * Math.sin((deg * Math.PI) / 180),
});

export const smoothstep = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};
