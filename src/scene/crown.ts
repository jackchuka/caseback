// Crown turning accumulated by Movement and read by Exterior to spin the crown mesh.
export const crownState = { rot: 0, wind: 0, quick: 0, set: 0, woundTurns: 0 };

import * as THREE from 'three';

// The crown cylinder lies along X after a Z tilt; spinning about its own Y axis must happen first, hence order ZYX.
export function crownEuler(theta: number): THREE.Euler {
  return new THREE.Euler(0, theta, Math.PI / 2, 'ZYX');
}
