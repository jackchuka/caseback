import * as THREE from 'three';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { crystalFront } from './case';
import { V } from './params';
import { outlines } from './plan';

// A flat sapphire cut to the dial opening, its face just under the case's main front.
export function venturaCrystal(): ExteriorLayer[] {
  const s = new THREE.Shape(outlines.dial.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: V.crystalThickness, bevelEnabled: false }).translate(0, 0, crystalFront());
  return [{ geometry: g, material: 'crystal' }];
}
