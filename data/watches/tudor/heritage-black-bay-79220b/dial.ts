import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import { T } from './params';

// Grows a convex polygon outward by d, keeping its edges parallel.
function offsetConvex(pts: Array<[number, number]>, d: number): Array<[number, number]> {
  const n = pts.length;
  const cx = pts.reduce((s, p) => s + p[0], 0) / n, cy = pts.reduce((s, p) => s + p[1], 0) / n;
  const normal = (a: [number, number], b: [number, number]): [number, number] => {
    const ex = b[0] - a[0], ey = b[1] - a[1], len = Math.hypot(ex, ey);
    const nx = ey / len, ny = -ex / len;
    return (a[0] - cx) * nx + (a[1] - cy) * ny > 0 ? [nx, ny] : [-nx, -ny];
  };
  return pts.map((p, i) => {
    const [ax, ay] = normal(pts[(i + n - 1) % n]!, p), [bx, by] = normal(p, pts[(i + 1) % n]!);
    const k = d / (1 + ax * bx + ay * by);
    return [p[0] + (ax + bx) * k, p[1] + (ay + by) * k];
  });
}

// Matte black, no date window, applied indices: lume in a polished surround. The printed text is left off.
export function tudorDial(m: MovementFrame): ExteriorLayer[] {
  const rad = T.dialRadius;
  const disc = new THREE.CircleGeometry(rad, 180);
  const pos = disc.getAttribute('position');
  const uv = disc.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (2 * rad) + 0.5, pos.getY(i) / (2 * rad) + 0.5);
  disc.rotateX(Math.PI).translate(0, 0, m.dialZ);
  const layers: ExteriorLayer[] = [{ geometry: disc, material: 'dial' }];
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
    const a = (h / 12) * Math.PI * 2;
    const at = (g: THREE.BufferGeometry, z: number) => g.rotateZ(a).translate(Math.sin(a) * ro, -Math.cos(a) * ro, z);
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
