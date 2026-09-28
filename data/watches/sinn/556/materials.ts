import * as THREE from 'three';
import { glass } from '../../../../src/scene/exterior/kit/glass';
import { withPolish } from '../../../../src/scene/exterior/kit/polish';
import { paintDial } from './dial';
import { S } from './params';

const STEEL = 0xdcdee2;
// Sinn's "satinized" steel: finer than a brush, not as dull as a blast.
const satin = () => new THREE.MeshPhysicalMaterial({ color: STEEL, metalness: 1, roughness: 0.4, envMapIntensity: 1.4 });

export function sinnMaterials(): Record<string, () => THREE.Material> {
  return {
    case: () => withPolish(satin(), 0.1),
    bezel: satin,
    bracelet: satin,
    // A dark, polished rehaut: in the photos it mirrors the minute track rather than reading as a grey band.
    flange: () => new THREE.MeshPhysicalMaterial({ color: 0x55585c, metalness: 1, roughness: 0.2 }),
    crystal: () => glass(1.2),
    // Opaque on purpose, so it never sorts against the crystal; gloss black under a clear coat.
    dial: () => new THREE.MeshPhysicalMaterial({ map: paintDial(), roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 }),
    // Separate from the movement lume so it fades with the dial; same colour so dial and hands match.
    'dial-lume': () => new THREE.MeshPhysicalMaterial({ color: S.lume, roughness: 0.5, metalness: 0 }),
    'caseback-metal': satin,
  };
}
