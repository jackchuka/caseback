import { useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import type { MovementMaterial } from '../../geometry/parts';
import { DISC_MATERIALS, type ExteriorMaterials } from './contract';

type DiscSet = Partial<Record<MovementMaterial, THREE.MeshPhysicalMaterial>>;

// A watch's own dressing for the movement's calendar discs, if it has any.
export function discMaterials(own: ExteriorMaterials): DiscSet | undefined {
  const made = DISC_MATERIALS.flatMap((k) => {
    const make = own[k];
    return make ? [[k, make()] as const] : [];
  });
  return made.length > 0 ? Object.fromEntries(made) : undefined;
}

// Built once per exterior build; their canvas textures are released when the build changes or the scene unmounts.
export function useDiscMaterials(own: ExteriorMaterials): DiscSet | undefined {
  const discs = useMemo(() => discMaterials(own), [own]);
  useEffect(
    () => () => {
      for (const m of Object.values(discs ?? {})) {
        m.map?.dispose();
        m.emissiveMap?.dispose();
        m.dispose();
      }
    },
    [discs],
  );
  return discs;
}
