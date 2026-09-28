import type * as THREE from 'three';
import { EXTRA_MOVEMENT_MATERIALS } from '../../geometry/parts';
import { MaterialKeySchema } from '../../model/schema';
import type { ExteriorBuild, ExteriorLayer } from './contract';

// Built by Exterior.tsx because they depend on the caliber (the engraving) and fade with the opening.
export const SHARED_EXTERIOR_MATERIALS = ['caseback-engraving', 'caseback-glass'] as const;
export const MOVEMENT_MATERIAL_KEYS: readonly string[] = [...MaterialKeySchema.options, ...EXTRA_MOVEMENT_MATERIALS];

export function resolveMaterial(key: string, own: Record<string, THREE.Material>, shared: Record<string, THREE.Material>): THREE.Material {
  const m = own[key] ?? shared[key];
  if (!m) throw new Error(`exterior material "${key}" is not defined by the watch or shared`);
  return m;
}

export function instantiate(b: ExteriorBuild): Record<string, THREE.Material> {
  return Object.fromEntries(Object.entries(b.materials).map(([k, make]) => [k, make()]));
}

export function materialKeys(layers: ExteriorLayer[]): string[] {
  return [...new Set(layers.flatMap((l) => (Array.isArray(l.material) ? l.material : [l.material])))];
}
