import type { Caliber } from '../model/schema';
import { focusKey } from '../model/validate';

export type V3 = [number, number, number];
export const MOVEMENT_ROTATION_VALUE = -Math.PI / 2;

export function focusCenterLocal(c: Caliber, key: string): V3 {
  const group = c.parts.filter((p) => focusKey(p) === key);
  if (group.length === 0) return [0, 0, 0];
  const x = group.reduce((a, p) => a + p.pos.x, 0) / group.length;
  const y = group.reduce((a, p) => a + p.pos.y, 0) / group.length;
  const z = Math.max(...group.map((p) => p.pos.z)) + 0.3;
  return [x, y, z];
}

// Movement group is rotated −π/2 about X: local (x, y, z) → world (x, z, −y).
export function toWorld([x, y, z]: V3): V3 {
  return [x, z, -y];
}
