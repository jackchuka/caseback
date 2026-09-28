import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { bracelet, type BraceletSpec } from './bracelet';

const spec: BraceletSpec = { startWidth: 21.6, endWidth: 18, pitch: 6, centerRatio: 0.42, thickness: 2.4, links: 5, gap: 0.15, wristRadius: 26, centerRaise: 0.15 };
const box = (ls: { geometry: THREE.BufferGeometry }[]) => {
  const b = new THREE.Box3();
  for (const l of ls) { l.geometry.computeBoundingBox(); b.union(l.geometry.boundingBox!); }
  return b;
};

describe('bracelet', () => {
  const layers = bracelet(spec, { y: 24, z: 2 }, { center: 'bracelet', outer: 'bracelet' });
  it('makes three pieces per link on both sides', () => {
    expect(layers).toHaveLength(spec.links * 3 * 2);
    expect(layers.filter((l) => l.name === 'bracelet-center')).toHaveLength(spec.links * 2);
  });
  it('is the start width at the lugs and narrows toward the end', () => {
    const plusY = layers.filter((l) => box([l]).min.y > 0);
    const first = box(plusY.slice(0, 3));
    const last = box(plusY.slice(-3));
    expect(first.max.x - first.min.x).toBeCloseTo(spec.startWidth, 1);
    expect(last.max.x - last.min.x).toBeLessThan(spec.startWidth - 1);
  });
  it('starts at the given point and curves toward the wrist', () => {
    const all = box(layers);
    expect(all.max.y).toBeGreaterThan(24);
    expect(all.max.z).toBeGreaterThan(6);
    expect(Math.min(...layers.filter((l) => box([l]).min.y > 0).map((l) => box([l]).min.y))).toBeCloseTo(24, 1);
  });
  it('faces outward on both sides, including the mirrored half', () => {
    for (const [k, l] of layers.entries()) {
      const g = l.geometry.index ? l.geometry.toNonIndexed() : l.geometry;
      const p = g.getAttribute('position');
      g.computeBoundingBox();
      const c = g.boundingBox!.getCenter(new THREE.Vector3());
      let outward = 0;
      const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
      for (let i = 0; i < p.count; i += 3) {
        a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); d.fromBufferAttribute(p, i + 2);
        const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a));
        outward += Math.sign(n.dot(a.clone().add(b).add(d).divideScalar(3).sub(c)));
      }
      expect(outward, `piece ${k}`).toBeGreaterThan(0);
    }
  });
});
