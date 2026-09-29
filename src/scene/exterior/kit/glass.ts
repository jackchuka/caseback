import * as THREE from 'three';
import { honourEnvMapIntensity } from '../../envIntensity';

// Sapphire without transmission: a transmissive material makes three.js render the whole opaque scene a second time
// every frame, which more than halved the frame budget. A black, additive surface adds only its reflections, so what
// lies behind stays untouched and `opacity` still fades the glass in and out.
// The reflection is a fraction of bare sapphire's: watch crystals are anti-reflective coated, and at full strength the
// studio's panels veiled whole dials. Fresnel still lets the glass flare at grazing angles.
export function glass(thickness = 0) {
  return honourEnvMapIntensity(new THREE.MeshPhysicalMaterial({
    color: 0x000000, metalness: 0, roughness: 0.02, ior: 1.77, envMapIntensity: 0.15 + thickness * 0.05,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
}
