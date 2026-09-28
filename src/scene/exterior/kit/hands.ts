import * as THREE from 'three';

export type P = [number, number];

// A hand's outline is a list of points on its right half (x ≥ 0), from the tail to the tip; mirroring closes it.
export const mirror = (half: P[]): P[] => [...half, ...half.slice(0, -1).reverse().filter(([x]) => x > 0).map(([x, y]): P => [-x, y])];

export const handShape = (pts: P[]) => {
  const s = new THREE.Shape();
  pts.forEach(([x, y], k) => (k === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
};

// A flat plate whose front (−Z) face is at z − thickness, with an optional bevel on its rim.
export function handPlate(pts: P[], thickness: number, z: number, bevel = 0) {
  const bt = Math.min(bevel, thickness / 3);
  const g = new THREE.ExtrudeGeometry(handShape(pts), { depth: thickness - 2 * bt, bevelEnabled: bevel > 0, bevelThickness: bt, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 1, curveSegments: 1 });
  return g.translate(0, 0, z - thickness + bt);
}

// The polished frame around a lume window, rounded to a ridge across its whole width. A flat frame faces the camera
// and mirrors the dark behind it; a rounded one turns some part of its section to every softbox in the studio.
export function handFrame(outline: P[], window: P[], z: number, height: number) {
  const s = handShape(outline);
  s.holes.push(handShape(window));
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.001, bevelEnabled: true, bevelThickness: height / 2, bevelSize: height / 2, bevelOffset: -height / 2, bevelSegments: 5, curveSegments: 1 });
  return g.translate(0, 0, z - 0.001 - height / 2);
}

export const handHub = (r: number, z: number, height = 0.2) => new THREE.CylinderGeometry(r, r, height, 40).rotateX(Math.PI / 2).translate(0, 0, z);

// Where a diamond with half-diagonals (along, across) centred at −c on the axis meets a strip of half-width w.
export const diamondAt = (c: number, along: number, across: number, w: number, side: 1 | -1): P => [w, -(c + side * along * (1 - w / across))];
