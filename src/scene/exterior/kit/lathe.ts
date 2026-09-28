import * as THREE from 'three';

// A solid of revolution from a (radius, z) profile, with the axis along Z like the watch.
export const lathe = (pts: Array<[number, number]>, segments = 180) =>
  new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segments).rotateX(Math.PI / 2);
