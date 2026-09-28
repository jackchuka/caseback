import * as THREE from 'three';
import type { ExteriorLayer } from '../contract';

// A screw-down caseback centred on the movement at depth `z`. A display back is a metal ring around a sapphire
// window; a solid one is engraved on its outer face (group 1 of the cylinder, which faces +Z after the turn).
export function caseback(outer: number, display: boolean, z: number): ExteriorLayer[] {
  const place = (g: THREE.BufferGeometry) => g.rotateX(Math.PI / 2).translate(0, 0, z);
  if (display) {
    return [
      { geometry: place(new THREE.CylinderGeometry(outer - 1.1, outer - 0.8, 1.0, 160, 1, true)), material: 'caseback-metal' },
      { geometry: place(new THREE.CylinderGeometry(outer - 1.15, outer - 1.15, 0.6, 160)), material: 'caseback-glass', name: 'caseback-glass', castShadow: false },
    ];
  }
  return [{ geometry: place(new THREE.CylinderGeometry(outer - 1.1, outer - 0.8, 1.0, 160)), material: ['caseback-metal', 'caseback-engraving', 'caseback-metal'], name: 'caseback-solid' }];
}
