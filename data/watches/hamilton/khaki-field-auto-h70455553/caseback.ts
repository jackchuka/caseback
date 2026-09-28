import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { caseBack } from './case';
import { H } from './params';

const BEVEL = 0.2;

// The ring's plan: a disc with six square notches for the case wrench, pierced by the window.
function ringShape() {
  const R = H.casebackRadius;
  const { count, width, depth } = H.casebackNotch;
  const half = width / 2;
  const alpha = Math.asin(half / R);
  const s = new THREE.Shape();
  for (let k = 0; k < count; k++) {
    const a = (k / count) * Math.PI * 2;
    const u = [Math.cos(a), Math.sin(a)], v = [-Math.sin(a), Math.cos(a)];
    const at = (r: number, side: number): [number, number] => [u[0]! * r + v[0]! * side, u[1]! * r + v[1]! * side];
    const outer = Math.sqrt(R * R - half * half);
    const p0 = at(outer, -half);
    if (k === 0) s.moveTo(...p0);
    else s.absarc(0, 0, R, ((k - 1) / count) * Math.PI * 2 + alpha, a - alpha, false);
    s.lineTo(...at(R - depth, -half));
    s.lineTo(...at(R - depth, half));
    s.lineTo(...at(outer, half));
  }
  s.absarc(0, 0, R, ((count - 1) / count) * Math.PI * 2 + alpha, Math.PI * 2 - alpha, false);
  s.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, H.casebackWindow, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return s;
}

// The screw-down display back: a notched steel ring holding a sapphire window over the whole rotor. The ring is
// open inside the window's radius, so the rotor clears it closed and while the back lifts and turns away.
export function hamiltonCaseback(m: MovementFrame): ExteriorLayer[] {
  const zi = caseBack(m), zo = zi + H.casebackThickness;
  const ring = new THREE.ExtrudeGeometry(ringShape(), {
    depth: H.casebackThickness - 2 * BEVEL, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelOffset: -BEVEL, bevelSegments: 2, curveSegments: 40,
  }).translate(0, 0, zi + BEVEL);
  const glassFront = zo - 0.1;
  const glass = new THREE.CylinderGeometry(H.casebackWindow - 0.02, H.casebackWindow - 0.02, H.casebackGlass, 160)
    .rotateX(Math.PI / 2).translate(0, 0, glassFront - H.casebackGlass / 2);
  return [
    { geometry: ring, material: 'caseback-metal', name: 'caseback-ring' },
    { geometry: glass, material: 'caseback-glass', name: 'caseback-glass', castShadow: false },
  ];
}
