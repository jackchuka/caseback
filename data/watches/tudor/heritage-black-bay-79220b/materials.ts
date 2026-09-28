import * as THREE from 'three';
import { withPolish } from '../../../../src/scene/exterior/kit/polish';
import { paintInsert } from './bezel';
import { paintDial } from './dial';
import { T } from './params';

const STEEL = 0xe2e4e8;

export function tudorMaterials(): Record<string, () => THREE.Material> {
  return {
    // Stainless reads as black in the dark studio at the movement's reflection strength; product photos light it harder.
    case: () => withPolish(new THREE.MeshPhysicalMaterial({ color: STEEL, metalness: 1, roughness: 0.34, envMapIntensity: 1.4 }), 0.07),
    polished: () => new THREE.MeshPhysicalMaterial({ color: STEEL, metalness: 1, roughness: 0.07, envMapIntensity: 1.4 }),
    crystal: () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 1.2, ior: 1.77, transparent: true }),
    // Opaque on purpose: a transparent dial would vanish behind the transmissive crystal.
    dial: () => new THREE.MeshPhysicalMaterial({ map: paintDial(), roughness: 0.85 }),
    // Separate from the movement lume so it fades with the dial; same colour so dial and hands match.
    'dial-lume': () => new THREE.MeshPhysicalMaterial({ color: T.lume, roughness: 0.5, metalness: 0 }),
    insert: () => new THREE.MeshPhysicalMaterial({ map: paintInsert(), roughness: 0.6, metalness: 0.15 }),
    // The case's brushed-top finish, so links and case read as one steel; a stronger reflection darkens the links'
    // shadowed faces against their edge highlights, and they read as thin lines on flat grey.
    bracelet: () => new THREE.MeshPhysicalMaterial({ color: STEEL, metalness: 1, roughness: 0.34, envMapIntensity: 1.4 }),
    'caseback-metal': () => new THREE.MeshPhysicalMaterial({ color: 0xc8cbd0, metalness: 1, roughness: 0.3, clearcoat: 0.15, clearcoatRoughness: 0.3 }),
  };
}
