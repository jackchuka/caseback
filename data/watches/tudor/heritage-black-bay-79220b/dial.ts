import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import { atHour, dialDisc, offsetConvex } from '../../../../src/scene/exterior/kit/dial';
import { T } from './params';

// Matte black, no date window, applied indices: lume in a polished surround. The printed text is left off.
export function tudorDial(m: MovementFrame): ExteriorLayer[] {
  const rad = T.dialRadius;
  const layers: ExteriorLayer[] = [{ geometry: dialDisc(rad, m.dialZ), material: 'dial' }];
  // Every index ends on the same outer circle, so dots, bars and the triangle sit at different centre radii.
  const ro = T.indexRing * rad;
  const dot = T.dotRadius * rad, bar = { w: T.barWidth * rad, l: T.barLength * rad };
  const tri: Array<[number, number]> = [[-T.triangle.width * rad / 2, 0], [T.triangle.width * rad / 2, 0], [0, T.triangle.height * rad]];
  // Local frame: the outer edge's midpoint at the origin, the dial centre toward +Y.
  const shape = (h: number, grow: number, depth: number) =>
    h === 0
      ? new THREE.ExtrudeGeometry(new THREE.Shape(offsetConvex(tri, grow).map(([x, y]) => new THREE.Vector2(x, y))), { depth, bevelEnabled: false }).translate(0, 0, -depth / 2)
      : h % 3 === 0
        ? new THREE.BoxGeometry(bar.w + 2 * grow, bar.l + 2 * grow, depth).translate(0, bar.l / 2, 0)
        : new THREE.CylinderGeometry(dot + grow, dot + grow, depth, 40).rotateX(Math.PI / 2).translate(0, dot, 0);
  for (let h = 0; h < 12; h++) {
    const at = (g: THREE.BufferGeometry, z: number) => atHour(g, h, ro, z);
    layers.push({ geometry: at(shape(h, 0, 0.3), m.dialZ - 0.18), material: 'dial-lume' });
    layers.push({ geometry: at(shape(h, T.surround, 0.24), m.dialZ - 0.12), material: 'polished' });
  }
  return layers;
}

// The disc is turned to face the front (rotateX(π)), which already flips it vertically; no pre-mirror.
export function paintDial() {
  return canvasTexture(2048, 2048, (g) => {
    const s = 2048, R = s / 2;
    g.fillStyle = '#0c0c0e';
    g.fillRect(0, 0, s, s);
    g.translate(R, R);
    g.fillStyle = '#ecebe6';
    for (let i = 0; i < 60; i++) {
      g.save();
      g.rotate((i / 60) * Math.PI * 2);
      const five = i % 5 === 0;
      g.fillRect(-R * (five ? 0.007 : 0.004), -R * 0.975, R * (five ? 0.014 : 0.008), R * (five ? 0.05 : 0.035));
      g.restore();
    }
  }, 8);
}
