import * as THREE from 'three';

// A solid of revolution from a (radius, z) profile, with the axis along Z like the watch.
export const lathe = (pts: Array<[number, number]>, segments = 180) =>
  new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segments).rotateX(Math.PI / 2);

// The flange (rehaut): a conical wall facing the centre, from the dial's edge out to where the case or bezel takes
// over. Each end is (radius, z).
export const flange = (dialEdge: [number, number], outerEdge: [number, number], segments = 180) => lathe([dialEdge, outerEdge], segments);
