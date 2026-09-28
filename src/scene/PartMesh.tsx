import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { buildShape, type Layer, type MovementMaterial } from '../geometry/parts';
import type { Part } from '../model/schema';
import { focusKey } from '../model/validate';
import { useMaterials } from './materials';
import { registry } from './registry';

export function PartMesh({ part, onPick, layersOverride }: { part: Part; onPick: (focus: string) => void; layersOverride?: Layer[] }) {
  const materials = useMaterials();
  const layers = useMemo(() => layersOverride ?? buildShape(part.shape, part.material), [part, layersOverride]);
  // Caliber part shapes only ever produce movement materials; watch materials belong to the exterior.
  const mats = useMemo(() => layers.map((l) => materials[l.material as MovementMaterial].clone()), [layers, materials]);
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    registry.set(part.id, { group: ref.current!, materials: mats, part });
    return () => {
      registry.delete(part.id);
    };
  }, [part, mats]);

  const meshes = layers.map((l, i) => <mesh key={i} geometry={l.geometry} material={mats[i]} castShadow receiveShadow />);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 4) return;
    e.stopPropagation();
    onPick(focusKey(part));
  };

  return (
    <group
      ref={ref}
      name={part.id}
      position={[part.pos.x, part.pos.y, part.pos.z]}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      {part.axis === 'x' && part.shape.kind !== 'stem' ? (
        <group rotation-y={Math.PI / 2}>{meshes}</group>
      ) : (
        meshes
      )}
    </group>
  );
}
