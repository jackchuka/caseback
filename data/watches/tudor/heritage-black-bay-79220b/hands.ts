import * as THREE from 'three';
import type { HandLayer } from '../../../../src/scene/exterior/contract';
import { T } from './params';

type P = [number, number];
const NECK = 0.35;
const TAIL = 1.8;
const FRAME = 0.26;

function plate(pts: P[], thickness: number, z: number) {
  const s = new THREE.Shape();
  pts.forEach(([x, y], k) => (k === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  // Lume sits on the front (−Z) face of the frame.
  return new THREE.ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false }).translate(0, 0, z - thickness);
}
const hub = (r: number, z: number) => new THREE.CylinderGeometry(r, r, 0.2, 40).rotateX(Math.PI / 2).translate(0, 0, z);

// Tudor's snowflake set: an hour hand with a large diamond lume plate, a long sword minute hand, and a seconds hand
// with a small square plate near its tip. Hands point to −Y and pivot at the origin.
export function tudorHands(dialRadius: number) {
  const hL = T.hour * dialRadius, mL = T.minute * dialRadius, sL = T.seconds * dialRadius;
  const d = T.snowflake, yc = -hL + d + 0.7;
  const hour: HandLayer[] = [
    { geometry: plate([[-NECK, TAIL], [NECK, TAIL], [NECK, yc + d - NECK], [d, yc], [NECK, yc - d + NECK], [0.2, -hL + 0.5], [0, -hL], [-0.2, -hL + 0.5], [-NECK, yc - d + NECK], [-d, yc], [-NECK, yc + d - NECK]], 0.12, 0), material: 'steel' },
    { geometry: plate([[0, yc + d - FRAME * 1.4], [d - FRAME * 1.4, yc], [0, yc - d + FRAME * 1.4], [-(d - FRAME * 1.4), yc]], 0.08, -0.12), material: 'lume' },
    { geometry: hub(0.9, -0.1), material: 'steel' },
  ];
  const w = 0.75;
  const minute: HandLayer[] = [
    { geometry: plate([[-NECK, TAIL], [NECK, TAIL], [w, -0.15 * mL], [w, -0.86 * mL], [0, -mL], [-w, -0.86 * mL], [-w, -0.15 * mL]], 0.12, 0), material: 'steel' },
    { geometry: plate([[w - FRAME, -0.18 * mL], [w - FRAME, -0.85 * mL], [0, -mL + 3 * FRAME], [-(w - FRAME), -0.85 * mL], [-(w - FRAME), -0.18 * mL]], 0.08, -0.12), material: 'lume' },
    { geometry: hub(0.8, -0.1), material: 'steel' },
  ];
  const q = T.secondsPlate, sc = -0.78 * sL, tail = T.secondsTail * dialRadius;
  const seconds: HandLayer[] = [
    { geometry: plate([[-0.3, tail], [0.3, tail], [0.12, -0.2 * sL], [0.05, -sL], [-0.05, -sL], [-0.12, -0.2 * sL]], 0.08, 0), material: 'steel' },
    { geometry: plate([[-(q + 0.15), sc + q + 0.15], [q + 0.15, sc + q + 0.15], [q + 0.15, sc - q - 0.15], [-(q + 0.15), sc - q - 0.15]], 0.08, 0), material: 'steel' },
    { geometry: plate([[-q, sc + q], [q, sc + q], [q, sc - q], [-q, sc - q]], 0.06, -0.08), material: 'lume' },
    { geometry: hub(0.7, -0.1), material: 'steel' },
  ];
  return { hour, minute, seconds };
}
