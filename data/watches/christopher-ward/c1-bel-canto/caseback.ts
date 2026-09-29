import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { lathe } from '../../../../src/scene/exterior/kit/lathe';
import { caseBack } from './case';
import { P } from './params';

const C = P.caseback;
// How deep the plate's back face sits behind the seat: the rotor turns in the pocket in front of it.
const POCKET_DEPTH = 0.6;

// The stamped soundwave (photo:caseback-viola): a small ring at the centre, then rings spreading out, each broken on
// the diagonals into four arcs centred on 3, 6, 9 and 12 o'clock; the gaps, 1.2 to 2.4 mm across, widen a little
// outward. Angles in radians from 3 o'clock toward 6, radii in mm.
export function soundwaveArcs(): Array<{ radius: number; from: number; to: number }> {
  const arcs: Array<{ radius: number; from: number; to: number }> = [{ radius: 1.6, from: 0, to: 2 * Math.PI }];
  for (let i = 1; i <= 7; i++) {
    const radius = 1.6 + 1.75 * i;
    const half = Math.PI / 4 - (1.0 + 0.2 * i) / radius / 2;
    for (let q = 0; q < 4; q++) arcs.push({ radius, from: (q * Math.PI) / 2 - half, to: (q * Math.PI) / 2 + half });
  }
  return arcs;
}

// A slotted screw head: a low dome whose slot is pressed into it across its middle.
function screwHead(x: number, y: number, z: number, turn: number) {
  const r = C.screwRadius, slot = 0.08, depth = 0.2;
  // Rising toward +Z, the back's outer side.
  const g = new THREE.SphereGeometry(r, 64, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.45, 1).rotateX(Math.PI / 2);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) if (Math.abs(p.getX(i)) < slot) p.setZ(i, Math.max(0, p.getZ(i) - depth));
  g.computeVertexNormals();
  return g.rotateZ(turn).translate(x, y, z);
}

// The solid titanium back: a flange out to the case edge, held by four slotted screws, and a raised plate with a
// polished bevel, stamped with the soundwave (its engraved text left off). Hollowed from the inside so the rotor
// clears it. It lifts straight off: it does not screw down.
export function belCantoCaseback(m: MovementFrame): ExteriorLayer[] {
  const zi = caseBack(m), zo = zi + C.thickness;
  const zf = zi + C.flangeThickness;
  const floor = zi + POCKET_DEPTH;
  const rim = lathe([[C.pocket, floor], [C.pocket, zi], [C.flange, zi], [C.flange, zf - 0.15], [C.flange - 0.15, zf], [C.bevelFrom, zf], [C.plate, zo], [C.plate, floor], [C.pocket, floor]], 240);
  const plate = new THREE.CylinderGeometry(C.plate, C.plate, zo - floor, 240).rotateX(Math.PI / 2).translate(0, 0, (zo + floor) / 2);
  const screws = C.screws.flatMap((deg, i) => {
    const a = (deg * Math.PI) / 180;
    return [{ geometry: screwHead(Math.cos(a) * C.screwAt, Math.sin(a) * C.screwAt, zf, 0.4 + i * 0.7), material: 'polished', name: 'caseback-screw' }];
  });
  return [
    { geometry: rim, material: 'caseback-metal', name: 'caseback-rim' },
    { geometry: plate, material: ['caseback-metal', 'caseback-wave', 'caseback-metal'], name: 'caseback-solid' },
    ...screws,
  ];
}
