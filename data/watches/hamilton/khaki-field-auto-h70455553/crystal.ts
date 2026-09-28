import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { bezelTop } from './bezel';
import { H } from './params';

// The sapphire's front rim, just proud of the bezel lip.
export const crystalRim = (m: MovementFrame) => bezelTop(m) - H.crystalProud;

// A sapphire sitting in the bezel lip, its front face domed very slightly; the wall runs down inside the lip.
export function hamiltonCrystal(m: MovementFrame): ExteriorLayer[] {
  const r = H.crystalRadius;
  const rim = crystalRim(m);
  const h = H.crystalDome;
  const R = (r * r + h * h) / (2 * h);
  const theta = Math.asin(r / R);
  const arc = Array.from({ length: 33 }, (_, i): [number, number] => {
    const a = (i / 32) * theta;
    return [R * Math.sin(a), rim - h + R * (1 - Math.cos(a))];
  });
  const pts = [...arc, [r, rim + H.crystalThickness] as [number, number]];
  const g = new THREE.LatheGeometry(pts.map(([x, z]) => new THREE.Vector2(x, z)), 180).rotateX(Math.PI / 2);
  return [{ geometry: g, material: 'crystal' }];
}
