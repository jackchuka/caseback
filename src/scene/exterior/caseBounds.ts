import type { ExteriorGeometry } from './contract';

export type CaseBounds = { radius: number; front: number; back: number };

// The round case: how far the case and bezel reach along 3–9 o'clock (where the lugs do not reach), and their depth.
export function caseBounds(build: ExteriorGeometry, fallbackRadius: number): CaseBounds {
  let radius = 0, front = Infinity, back = -Infinity;
  for (const l of [...build.parts.case, ...build.parts.bezel]) {
    if (!l.geometry.boundingBox) l.geometry.computeBoundingBox();
    const b = l.geometry.boundingBox!;
    radius = Math.max(radius, -b.min.x, b.max.x);
    front = Math.min(front, b.min.z);
    back = Math.max(back, b.max.z);
  }
  return radius > 0 ? { radius, front, back } : { radius: fallbackRadius, front: -2, back: 2 };
}
