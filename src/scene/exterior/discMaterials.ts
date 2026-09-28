import type * as THREE from 'three';
import type { MovementMaterial } from '../../geometry/parts';
import { DISC_MATERIALS, type ExteriorMaterials } from './contract';

// A watch's own dressing for the movement's calendar discs, if it has any.
export function discMaterials(own: ExteriorMaterials): Partial<Record<MovementMaterial, THREE.MeshPhysicalMaterial>> | undefined {
  const keys = DISC_MATERIALS.filter((k) => own[k]);
  return keys.length > 0 ? Object.fromEntries(keys.map((k) => [k, own[k]!() as THREE.MeshPhysicalMaterial])) : undefined;
}
