import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { bezelTop } from './bezel';
import { T } from './params';

// A box sapphire: a short straight wall standing out of the bezel, capped by a spherical dome.
export function tudorCrystal(m: MovementFrame): ExteriorLayer[] {
  const r = T.crystalRadius;
  const rim = bezelTop(m) - T.crystalWall;
  const h = T.crystalDome;
  const R = (r * r + h * h) / (2 * h);
  const theta = Math.asin(r / R);
  const arc = Array.from({ length: 33 }, (_, i): [number, number] => {
    const a = (i / 32) * theta;
    return [R * Math.sin(a), rim - h + R * (1 - Math.cos(a))];
  });
  const pts = [...arc, [r, bezelTop(m) + 0.3] as [number, number]];
  const g = new THREE.LatheGeometry(pts.map(([x, z]) => new THREE.Vector2(x, z)), 180).rotateX(Math.PI / 2);
  return [{ geometry: g, material: 'crystal' }];
}
