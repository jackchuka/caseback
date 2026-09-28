import * as THREE from 'three';
import { glass } from '../kit/glass';
import { withPolish } from '../kit/polish';
import type { LegacyConfig } from './config';
import { paintDial, paintInsert, paintStrap } from './paint';

const CASE_COLORS = { steel: [0xc8cbd0, 0.3], titanium: [0xa9acb0, 0.45], gold: [0xe6c27a, 0.25] } as const;

export function legacyMaterials(e: LegacyConfig): Record<string, () => THREE.Material> {
  const metal = e.case.material === 'steel' ? 0xe2e4e8 : CASE_COLORS[e.case.material][0];
  const [backColor, backRoughness] = CASE_COLORS[e.case.material];
  return {
    // Stainless cases read as black in the dark studio at the movement's reflection strength; product photos light them harder.
    case: () => withPolish(new THREE.MeshPhysicalMaterial({ color: metal, metalness: 1, roughness: 0.36, envMapIntensity: 1.4 }), 0.08),
    polished: () => new THREE.MeshPhysicalMaterial({ color: metal, metalness: 1, roughness: 0.08, envMapIntensity: 1.4 }),
    crystal: () => glass(0.8),
    // Opaque and removed by lifting and hiding instead of fading, so it never sorts against the crystal.
    dial: () => new THREE.MeshPhysicalMaterial({ map: paintDial(e), roughness: e.dial.finish === 'matte' ? 0.8 : 0.35, clearcoat: e.dial.finish === 'gloss' ? 1 : 0 }),
    insert: () => new THREE.MeshPhysicalMaterial({ map: paintInsert(e), roughness: 0.5, metalness: 0.1 }),
    strap: () =>
      e.strap.kind === 'bracelet'
        ? new THREE.MeshPhysicalMaterial({ color: e.strap.color, metalness: 1, roughness: 0.3, envMapIntensity: 2.2 })
        : new THREE.MeshPhysicalMaterial({ map: paintStrap(e), metalness: 0, roughness: 0.7, sheen: 0.4 }),
    tube: () => new THREE.MeshPhysicalMaterial({ color: e.crown.tubeColor ?? '#888888', metalness: 0.6, roughness: 0.3 }),
    // Dial lume fades with the dial, so it must not share the hands' material.
    lume: () => new THREE.MeshPhysicalMaterial({ color: e.dial.lume ?? '#f2eee2', roughness: 0.5, metalness: 0 }),
    'caseback-metal': () => new THREE.MeshPhysicalMaterial({ color: backColor, metalness: 1, roughness: backRoughness, clearcoat: 0.15, clearcoatRoughness: 0.3 }),
  };
}
