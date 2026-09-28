import * as THREE from 'three';

// Sapphire without transmission: a transmissive material makes three.js render the whole opaque scene a second time
// every frame, which more than halved the frame budget. A black, additive surface adds only its reflections, so what
// lies behind stays untouched and `opacity` still fades the glass in and out.
export function glass(thickness = 0) {
  return new THREE.MeshPhysicalMaterial({
    color: 0x000000, metalness: 0, roughness: 0.02, ior: 1.77, envMapIntensity: 1.5 + thickness * 0.5,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}
