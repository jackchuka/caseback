import * as THREE from 'three';

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

export type BoxStrapSpec = { width: number; length: number; thickness: number; endWidth: number; endThickness: number; straight: number; wristRadius: number };

// Narrows from the lugs to the free end and thins from the lug end, both over the strap's length.
function taper(g: THREE.BufferGeometry, s: BoxStrapSpec, start: number, z: number) {
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, Math.max(0, (p.getY(i) - start) / s.length));
    p.setX(i, p.getX(i) * (1 - (1 - s.endWidth / s.width) * t));
    p.setZ(i, z + (p.getZ(i) - z) * (1 - (1 - s.endThickness / s.thickness) * t));
  }
  p.needsUpdate = true;
  return g;
}

// The two halves of a plain tapered strap, 6 o'clock side then 12, each a box of (across, along) segments that starts
// at `start`, runs straight on for `straight` and then bends round the wrist.
export function boxStrap(s: BoxStrapSpec, start: { y: number; z: number }, segments: [number, number]): THREE.BufferGeometry[] {
  return ([1, -1] as const).map((dir) => {
    const box = new THREE.BoxGeometry(s.width, s.length, s.thickness, segments[0], segments[1], 1).translate(0, start.y + s.length / 2, start.z);
    const g = taper(box, s, start.y, start.z);
    const placed = dir < 0 ? flipWinding(g.scale(1, -1, 1)) : g;
    return bend(placed, s.wristRadius, start.y + s.straight, dir);
  });
}
