import * as THREE from 'three';
import { glass } from '../../../../src/scene/exterior/kit/glass';
import { paintDial, paintGrille } from './dial';

const STEEL = 0xe4e6ea;

export function venturaMaterials(): Record<string, () => THREE.Material> {
  return {
    // The real case is mirror-polished all over; a mirror renders black in the dark studio, so the metal is a little
    // rough (0.22) to catch the softboxes. A lighting compromise, not the finish.
    case: () => new THREE.MeshPhysicalMaterial({ color: STEEL, metalness: 1, roughness: 0.22, envMapIntensity: 1.6 }),
    polished: () => new THREE.MeshPhysicalMaterial({ color: STEEL, metalness: 1, roughness: 0.14, envMapIntensity: 1.6 }),
    crystal: () => glass(1.5),
    // Opaque on purpose, so it never sorts against the crystal.
    dial: () => new THREE.MeshPhysicalMaterial({ map: paintDial(), metalness: 0.2, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    // Cut by alpha test, not blended: the movement shows through the holes and nothing needs sorting.
    'dial-grille': () => {
      const mask = paintGrille();
      mask.wrapS = mask.wrapT = THREE.RepeatWrapping;
      return new THREE.MeshPhysicalMaterial({ color: 0x5b5f66, metalness: 0.8, roughness: 0.35, alphaMap: mask, alphaTest: 0.5, side: THREE.DoubleSide });
    },
    // photo:front: what shows behind the grille where a date ring would be is near-black, a dull metal.
    'dial-shade': () => new THREE.MeshPhysicalMaterial({ color: 0x141517, metalness: 0.4, roughness: 0.6 }),
    strap: () => new THREE.MeshPhysicalMaterial({ color: 0x1b1c1e, roughness: 0.62, sheen: 0.3, sheenColor: new THREE.Color(0x55585e) }),
    'caseback-metal': () => new THREE.MeshPhysicalMaterial({ color: STEEL, metalness: 1, roughness: 0.2, envMapIntensity: 1.5 }),
  };
}
