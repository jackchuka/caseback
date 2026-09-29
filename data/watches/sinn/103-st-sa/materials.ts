import * as THREE from 'three';
import { glass } from '../../../../src/scene/exterior/kit/glass';
import { lumeMaterial } from '../../../../src/scene/lume';
import { dateNumbers, dayNames } from '../../../../src/scene/textures';
import { paintInsert } from './bezel';
import { paintDial } from './dial';
import { P } from './params';

const STEEL = 0xe2e4e8;
const WHITE_ON_BLACK = { ground: '#0c0c0d', ink: '#f1f1ee' };
const disc = (map: THREE.Texture) => {
  map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  return new THREE.MeshPhysicalMaterial({ map, roughness: 0.6, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.3 });
};
const polished = () => new THREE.MeshPhysicalMaterial({ color: STEEL, metalness: 1, roughness: 0.08, envMapIntensity: 1.5 });

export function sinnMaterials(): Record<string, () => THREE.Material> {
  return {
    // Polished all over, as Sinn lists it.
    case: polished,
    polished,
    bezel: polished,
    // The insert's black is anodised aluminium: a little sheen, no mirror.
    insert: () => new THREE.MeshPhysicalMaterial({ map: paintInsert(), roughness: 0.45, metalness: 0.2 }),
    flange: () => new THREE.MeshPhysicalMaterial({ color: 0x141416, roughness: 0.6 }),
    // A faint reflection, as through Sinn's anti-reflective coating: the tall dome would otherwise mirror the studio's
    // light panels across the whole dial.
    crystal: () => Object.assign(glass(0), { envMapIntensity: 0.12, specularIntensity: 0.4 }),
    // Opaque on purpose, so it never sorts against the crystal; matte black.
    // The studio lights the dial less than Sinn's photo does; the print's own emission keeps it white, the black black.
    dial: () => {
      const face = paintDial();
      return new THREE.MeshPhysicalMaterial({ map: face, roughness: 0.75, emissive: 0xffffff, emissiveMap: face, emissiveIntensity: 0.35 });
    },
    print: () => new THREE.MeshPhysicalMaterial({ color: P.print, roughness: 0.7, emissive: P.print, emissiveIntensity: 0.35 }),
    // Separate from the movement lume so it fades with the dial; same colour so dial and hands match.
    'dial-lume': () => lumeMaterial(),
    strap: () => new THREE.MeshPhysicalMaterial({ color: 0x0c0c0e, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
    stitch: () => new THREE.MeshPhysicalMaterial({ color: 0xe8e2d0, roughness: 0.8 }),
    'caseback-metal': polished,
    // Sinn prints its day and date white on black.
    date: () => disc(dateNumbers(31, { ...WHITE_ON_BLACK, size: 1.35 })),
    day: () => disc(dayNames(WHITE_ON_BLACK)),
  };
}
