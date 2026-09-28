import * as THREE from 'three';

// A solid of revolution from a (radius, z) profile, with the axis along Z like the watch.
export const lathe = (pts: Array<[number, number]>, segments = 180) =>
  new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segments).rotateX(Math.PI / 2);

// LatheGeometry averages each profile point's normal over its two segments, which rounds every corner in the shading.
// A point given twice leaves a zero-length segment between the copies, so each copy takes only its own side's normal
// and the corner shades as a hard crease.
export const crease = (p: [number, number]): Array<[number, number]> => [p, p];

// The flange (rehaut): a conical wall facing the centre, from the dial's edge out to where the case or bezel takes
// over. Each end is (radius, z).
export const flange = (dialEdge: [number, number], outerEdge: [number, number], segments = 180) => lathe([dialEdge, outerEdge], segments);
