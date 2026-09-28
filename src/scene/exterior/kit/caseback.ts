import * as THREE from 'three';
import type { ExteriorLayer } from '../contract';
import { lathe } from './lathe';

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

export type HollowBack = {
  // Flank radius at the seat, and how much it narrows toward the outer face.
  radius: number; taper: number;
  // The seat (inner face) and the back's full thickness toward +Z.
  seat: number; thickness: number;
  // Radius of the pocket hollowed from the inside, which must clear the rotor.
  pocket: number;
  // Solid: the plate closing the pocket, flush with the outer face. Display: the sapphire filling the ring's opening,
  // `glass` thick and set back `recess` from the outer face.
  back: { kind: 'solid'; plate: number } | { kind: 'display'; glass: number; recess: number };
  segments?: number;
};

// A screw-down back hollowed from the inside: the movement model's rotor reaches almost to the case's back plane, so
// a solid back would swallow the rotor and show it poking through as the back unscrews and lifts. The solid plate
// carries the shared engraving on its outer face; a display back shows the movement through `caseback-glass`.
export function hollowCaseback(o: HollowBack): ExteriorLayer[] {
  const n = o.segments ?? 160;
  const zi = o.seat, zo = zi + o.thickness;
  const flank = (z: number) => o.radius - (o.taper * (z - zi)) / o.thickness;
  if (o.back.kind === 'solid') {
    const zj = zo - o.back.plate;
    const plate = new THREE.CylinderGeometry(flank(zo), flank(zj), o.back.plate, n).rotateX(Math.PI / 2).translate(0, 0, (zo + zj) / 2);
    const rim = lathe([[o.pocket, zj], [o.pocket, zi], [flank(zi), zi], [flank(zj), zj], [o.pocket, zj]], n);
    return [
      { geometry: plate, material: ['caseback-metal', 'caseback-engraving', 'caseback-metal'], name: 'caseback-solid' },
      { geometry: rim, material: 'caseback-metal' },
    ];
  }
  const { glass: t, recess } = o.back;
  const ring = lathe([[o.pocket, zo], [o.pocket, zi], [flank(zi), zi], [flank(zo), zo], [o.pocket, zo]], n);
  const g = new THREE.CylinderGeometry(o.pocket + 0.02, o.pocket + 0.02, t, n).rotateX(Math.PI / 2).translate(0, 0, zo - recess - t / 2);
  return [
    { geometry: ring, material: 'caseback-metal' },
    { geometry: g, material: 'caseback-glass', name: 'caseback-glass', castShadow: false },
  ];
}
