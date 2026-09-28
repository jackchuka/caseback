import * as THREE from 'three';
import { glass } from '../../../../src/scene/exterior/kit/glass';
import { paintDial } from './dial';

const STEEL = 0xe4e6ea;

export function presageMaterials(): Record<string, () => THREE.Material> {
  return {
    // Polished all over, as the product photos show; product lighting reads brighter than the studio, hence the boost.
    case: () => new THREE.MeshPhysicalMaterial({ color: STEEL, metalness: 1, roughness: 0.1, envMapIntensity: 1.5 }),
    polished: () => new THREE.MeshPhysicalMaterial({ color: STEEL, metalness: 1, roughness: 0.06, envMapIntensity: 1.5 }),
    crystal: () => glass(1.5),
    // Opaque on purpose, so it never sorts against the crystal. The clearcoat carries the pressed rays' sheen.
    // The studio lights the dial less than the product photos do; a little emission keeps its icy tone from greying.
    dial: () => {
      const face = paintDial();
      return new THREE.MeshPhysicalMaterial({ map: face, roughness: 0.4, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.2, emissive: 0xffffff, emissiveMap: face, emissiveIntensity: 0.25 });
    },
    // Applied daggers: a slightly rougher polish than the case so their facets pick up light from more of the studio.
    index: () => new THREE.MeshPhysicalMaterial({ color: STEEL, metalness: 1, roughness: 0.2, envMapIntensity: 2 }),
    flange: () => new THREE.MeshPhysicalMaterial({ color: 0xb9c3cf, roughness: 0.5, metalness: 0.3 }),
    // Glossy black calf, as on the product photos.
    strap: () => new THREE.MeshPhysicalMaterial({ color: 0x0b0d12, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.12 }),
    stitch: () => new THREE.MeshPhysicalMaterial({ color: 0x2c4fb0, roughness: 0.8 }),
    'caseback-metal': () => new THREE.MeshPhysicalMaterial({ color: 0xd0d3d7, metalness: 1, roughness: 0.12 }),
  };
}
