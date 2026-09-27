import * as THREE from 'three';

type ToothProfile = { tip: number; root: number; width: number };
const WHEEL: ToothProfile = { tip: 1.25, root: 1.55, width: 0.46 };

// Cycloidal-style tooth: radial flanks below the pitch circle, ogival addendum above it (NIHS 20-02 approximation).
export function gearOutline(teeth: number, module: number, profile: ToothProfile = WHEEL): THREE.Shape {
  const r = (module * teeth) / 2;
  const ra = r + profile.tip * module;
  const rf = r - profile.root * module;
  const pitch = (Math.PI * 2) / teeth;
  const tw = profile.width * pitch;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < teeth; i++) {
    const c = i * pitch;
    pts.push([rf, c - pitch / 2 + 0.02 * pitch], [rf, c - tw / 2 - 0.02 * pitch], [r * 0.995, c - tw / 2]);
    for (let k = 1; k < 10; k++) {
      const t = -1 + (2 * k) / 10;
      pts.push([r + (ra - r) * Math.sqrt(1 - t * t), c + (t * tw) / 2]);
    }
    pts.push([r * 0.995, c + tw / 2], [rf, c + tw / 2 + 0.02 * pitch]);
  }
  const shape = new THREE.Shape();
  pts.forEach(([rr, a], i) => {
    const x = rr * Math.cos(a);
    const y = rr * Math.sin(a);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  return shape;
}

export const PINION: ToothProfile = { tip: 1.1, root: 1.3, width: 0.5 };

export function addSpokes(shape: THREE.Shape, rIn: number, rOut: number, count: number, width: number): void {
  for (let i = 0; i < count; i++) {
    const a0 = (i * Math.PI * 2) / count;
    const a1 = ((i + 1) * Math.PI * 2) / count;
    const dIn = width / 2 / rIn;
    const dOut = width / 2 / rOut;
    const hole = new THREE.Path();
    hole.absarc(0, 0, rOut, a0 + dOut, a1 - dOut, false);
    hole.absarc(0, 0, rIn, a1 - dIn, a0 + dIn, true);
    hole.closePath();
    shape.holes.push(hole);
  }
}

export function extrudeCentered(shape: THREE.Shape, depth: number, bevel: number): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 48,
  });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}
