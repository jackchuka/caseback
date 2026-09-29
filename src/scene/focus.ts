import type { Caliber } from '../model/schema';
import { focusKey } from '../model/validate';

export type V3 = [number, number, number];
export const MOVEMENT_ROTATION = -Math.PI / 2;

export type Side = 'back' | 'dial';

export function focusCenterLocal(c: Caliber, key: string, side: Side = 'back'): V3 {
  const group = c.parts.filter((p) => focusKey(p) === key);
  if (group.length === 0) return [0, 0, 0];
  const x = group.reduce((a, p) => a + p.pos.x, 0) / group.length;
  const y = group.reduce((a, p) => a + p.pos.y, 0) / group.length;
  const z = side === 'back' ? Math.max(...group.map((p) => p.pos.z)) + 0.3 : Math.min(...group.map((p) => p.pos.z)) - 0.3;
  return [x, y, z];
}

// Movement group is rotated −π/2 about X; the flip group adds π about X for the dial side.
export function toWorld([x, y, z]: V3, side: Side): V3 {
  return side === 'back' ? [x, z, -y] : [x, -z, y];
}
