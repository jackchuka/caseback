import * as THREE from 'three';

export const LUME = 0xf2eee2;
// Hands and dial share this recipe (a dial's own 'dial-lume' must match the hands'). The faint self-glow is a lighting
// compromise, not afterglow: product photos light lume from the camera side and it reads creamy white; lit only by
// the studio it went grey.
export const LUME_GLOW = 0.14;
export function lumeMaterial(color: THREE.ColorRepresentation = LUME) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0, emissive: color, emissiveIntensity: LUME_GLOW });
}
