import * as THREE from 'three';
import { glass } from '../../../../src/scene/exterior/kit/glass';
import { lumeMaterial } from '../../../../src/scene/lume';
import { withPolish } from '../../../../src/scene/exterior/kit/polish';
import { paintDial } from './dial';
import { H } from './params';
import { paintStrap } from './strap';

const STEEL = 0xe2e4e8;

export function hamiltonMaterials(): Record<string, () => THREE.Material> {
  return {
    // Brushed all over but for the bevel; the per-vertex polish attribute carries the bevel.
    case: () => withPolish(new THREE.MeshPhysicalMaterial({ color: STEEL, metalness: 1, roughness: 0.36, envMapIntensity: 1.4 }), 0.07),
    polished: () => new THREE.MeshPhysicalMaterial({ color: STEEL, metalness: 1, roughness: 0.06, envMapIntensity: 1.4 }),
    // Satin silver, lighter than the polished bezel: the rehaut and the date window's frame.
    flange: () => new THREE.MeshPhysicalMaterial({ color: 0xcfd3d6, metalness: 0.6, roughness: 0.45 }),
    crystal: () => glass(1.2),
    // Opaque on purpose, so it never sorts against the crystal.
    dial: () => new THREE.MeshPhysicalMaterial({ map: paintDial(), metalness: 0.1, roughness: 0.5 }),
    // Separate from the movement lume so it fades with the dial; same colour so dial and hands match.
    'dial-lume': () => lumeMaterial(H.lume),
    strap: () => new THREE.MeshPhysicalMaterial({ map: paintStrap(), roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(0x8a5a40) }),
    'strap-edge': () => new THREE.MeshPhysicalMaterial({ color: 0x3f1f14, roughness: 0.5 }),
    'strap-lining': () => new THREE.MeshPhysicalMaterial({ color: H.liningColor, roughness: 0.8 }),
    'caseback-metal': () => new THREE.MeshPhysicalMaterial({ color: 0xc8cbd0, metalness: 1, roughness: 0.32, clearcoat: 0.15, clearcoatRoughness: 0.3 }),
  };
}
