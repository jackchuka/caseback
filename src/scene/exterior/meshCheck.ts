import * as THREE from 'three';

// Counts edges not shared by exactly two triangles, and the signed volume (positive when faces point outward).
export function closedAndOutward(g: THREE.BufferGeometry) {
  const idx = g.getIndex()!;
  const p = g.getAttribute('position');
  const edges = new Map<string, number>();
  let volume = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < idx.count; i += 3) {
    const t = [idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)];
    for (let k = 0; k < 3; k++) {
      const u = t[k]!, v = t[(k + 1) % 3]!;
      const key = u < v ? `${u},${v}` : `${v},${u}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
    a.fromBufferAttribute(p, t[0]!); b.fromBufferAttribute(p, t[1]!); c.fromBufferAttribute(p, t[2]!);
    volume += a.dot(b.clone().cross(c)) / 6;
  }
  const open = [...edges.values()].filter((n) => n !== 2).length;
  return { open, volume };
}
