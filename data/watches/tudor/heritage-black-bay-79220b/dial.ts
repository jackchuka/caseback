import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import { T } from './params';

// Matte black, no date window, applied indices: lume in a polished surround. The printed text is left off.
export function tudorDial(m: MovementFrame): ExteriorLayer[] {
  const rad = T.dialRadius;
  const disc = new THREE.CircleGeometry(rad, 180);
  const pos = disc.getAttribute('position');
  const uv = disc.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (2 * rad) + 0.5, pos.getY(i) / (2 * rad) + 0.5);
  disc.rotateX(Math.PI).translate(0, 0, m.dialZ);
  const layers: ExteriorLayer[] = [{ geometry: disc, material: 'dial' }];
  const ri = T.indexRing * rad;
  const dot = T.dotRadius * rad, bar = { w: T.barWidth * rad, l: T.barLength * rad }, tri = T.triangle * rad;
  // The 12 o'clock triangle points toward the centre.
  const shape = (h: number, grow: number, depth: number) =>
    h === 0
      ? new THREE.CylinderGeometry(tri + grow, tri + grow, depth, 3).rotateX(Math.PI / 2).rotateZ(Math.PI)
      : h % 3 === 0
        ? new THREE.BoxGeometry(bar.w + 2 * grow, bar.l + 2 * grow, depth)
        : new THREE.CylinderGeometry(dot + grow, dot + grow, depth, 40).rotateX(Math.PI / 2);
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2;
    const at = (g: THREE.BufferGeometry, z: number) => g.rotateZ(-a).translate(Math.sin(a) * ri, -Math.cos(a) * ri, z);
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
