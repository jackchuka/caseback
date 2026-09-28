import type * as THREE from 'three';

// Grip flutes about 0.55 mm apart, as cut on the reference crowns.
export function fluteCount(diameterMm: number, pitchMm = 0.55) {
  return Math.max(16, Math.round((Math.PI * diameterMm) / pitchMm));
}

// Rounded grooves around a turned part: vertices on the outer surface within [from, to] along the axis move inward
// by a raised cosine around each groove centre. The mesh needs about four segments per flute to show them.
export function cutFlutes(g: THREE.BufferGeometry, o: { axis: 'y' | 'z'; radius: number; count: number; depth: number; from: number; to: number }) {
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const u = o.axis === 'y' ? p.getZ(i) : p.getY(i);
    const along = o.axis === 'y' ? p.getY(i) : p.getZ(i);
    if (Math.hypot(x, u) < o.radius - 0.01 || along < o.from - 0.01 || along > o.to + 0.01) continue;
    const k = 1 - (o.depth / o.radius) * Math.max(0, Math.cos(Math.atan2(u, x) * o.count)) ** 2;
    if (o.axis === 'y') p.setXYZ(i, x * k, along, u * k);
    else p.setXYZ(i, x * k, u * k, along);
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}
