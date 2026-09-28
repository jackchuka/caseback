import type * as THREE from 'three';

// Wraps the part of a geometry beyond startY around a cylinder of `radius` about the X axis, curving toward +Z
// (the wrist). `dir` selects the +Y (6 o'clock) or −Y (12 o'clock) side.
export function bend(g: THREE.BufferGeometry, radius: number, startY: number, dir: 1 | -1): THREE.BufferGeometry {
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) * dir;
    if (y <= startY) continue;
    const s = y - startY;
    const a = s / radius;
    const z = p.getZ(i);
    p.setY(i, (startY + (radius - z) * Math.sin(a)) * dir);
    p.setZ(i, radius - (radius - z) * Math.cos(a));
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}
