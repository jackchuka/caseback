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

// Mirroring a mesh with a negative scale turns it inside out; swapping each triangle's winding restores it.
export function flipWinding(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const idx = g.index;
  if (idx) {
    for (let i = 0; i < idx.count; i += 3) {
      const t = idx.getX(i + 1);
      idx.setX(i + 1, idx.getX(i + 2));
      idx.setX(i + 2, t);
    }
    idx.needsUpdate = true;
    return g;
  }
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i += 3) {
    const x = p.getX(i + 1), y = p.getY(i + 1), z = p.getZ(i + 1);
    p.setXYZ(i + 1, p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2));
    p.setXYZ(i + 2, x, y, z);
  }
  p.needsUpdate = true;
  return g;
}
