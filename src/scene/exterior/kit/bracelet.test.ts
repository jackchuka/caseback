import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { bracelet, hLinkBracelet, plateProfile, type BraceletSpec } from './bracelet';

const spec: BraceletSpec = {
  startWidth: 21.6, endWidth: 18, pitch: 6, centerRatio: 0.55, thickness: 2.4, links: 5, gap: 0.15, wristRadius: 26,
  centerRaise: 0.15, chamfer: 0.3, crown: 0.12,
};
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
  it('gives the centre piece its share of the width, with real gaps on both sides', () => {
    const firstLink = layers.filter((l) => box([l]).min.y > 0).slice(0, 3);
    const outerL = box([firstLink[0]!]), center = box([firstLink[1]!]), outerR = box([firstLink[2]!]);
    const total = box(firstLink);
    expect((center.max.x - center.min.x) / (total.max.x - total.min.x)).toBeCloseTo(spec.centerRatio, 1);
    expect(center.min.x - outerL.max.x).toBeGreaterThan(0);
    expect(outerR.min.x - center.max.x).toBeGreaterThan(0);
  });
  it('starts at the given point and curves toward the wrist', () => {
    const all = box(layers);
    expect(all.max.y).toBeGreaterThan(24);
    expect(all.max.z).toBeGreaterThan(6);
    expect(Math.min(...layers.filter((l) => box([l]).min.y > 0).map((l) => box([l]).min.y))).toBeCloseTo(24, 1);
  });
  it('chamfers the top face of every built piece', () => {
    // The first link's near end ring lies at start.y, before the wrist bend begins, so it is the plain profile.
    for (const l of layers.slice(0, 3)) {
      const p = l.geometry.getAttribute('position');
      const ring: Array<[number, number]> = [];
      for (let i = 0; i < p.count; i++) if (Math.abs(Math.abs(p.getY(i)) - 24) < 1e-6) ring.push([p.getX(i), p.getZ(i)]);
      const zs = ring.map(([, z]) => z);
      const zTop = Math.min(...zs), zMid = (zTop + Math.max(...zs)) / 2;
      const halfWidthAt = (pick: (z: number) => boolean) => {
        const xs = ring.filter(([, z]) => pick(z)).map(([x]) => x);
        return (Math.max(...xs) - Math.min(...xs)) / 2;
      };
      const top = halfWidthAt((z) => z < zTop + spec.chamfer / 2);
      const mid = halfWidthAt((z) => Math.abs(z - zMid) < spec.thickness / 2 - 0.01);
      expect(top).toBeLessThanOrEqual(mid - spec.chamfer + 1e-6);
    }
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

describe('plateProfile', () => {
  const width = 10, thickness = 3, chamfer = 0.4, crown = 0.15;
  const profile = plateProfile(width, thickness, chamfer, crown, 6);

  it('is narrower at the top face than at mid-height, from the chamfer', () => {
    const backXs = profile.filter(([, z]) => z === thickness / 2).map(([x]) => Math.abs(x));
    const topXs = profile.slice(2, profile.length - 2).map(([x]) => Math.abs(x));
    expect(Math.max(...backXs)).toBeCloseTo(width / 2, 9);
    expect(Math.max(...topXs)).toBeLessThanOrEqual(width / 2 - chamfer + 1e-9);
  });

  it('raises the centre above the chamfer corners, from the crown', () => {
    const centre = profile.find(([x]) => Math.abs(x) < 1e-6)!;
    const corner = profile.find(([x]) => Math.abs(x - (width / 2 - chamfer)) < 1e-6)!;
    // z is local depth; more negative is further outward (toward the viewer).
    expect(centre[1]).toBeLessThan(corner[1]);
  });

  it('is flat with no arch when crown is 0', () => {
    const flat = plateProfile(width, thickness, chamfer, 0, 6);
    const zs = flat.slice(2, flat.length - 2).map(([, z]) => z);
    for (const z of zs) expect(z).toBeCloseTo(-thickness / 2, 9);
  });
});

describe('H-link bracelet', () => {
  const h = { ...spec, startWidth: 19.6, endWidth: 18, pitch: 10, centerRatio: 0.5, bar: 2.4, links: 4, centerRaise: 0 };
  const layers = hLinkBracelet(h, { y: 24, z: 2 }, { center: 'bracelet', outer: 'bracelet' });
  const first = layers.slice(0, 4);
  it('makes two rails, a crossbar and a centre link per pitch on both sides', () => {
    expect(layers).toHaveLength(h.links * 4 * 2);
    expect(layers.filter((l) => l.name === 'bracelet-center')).toHaveLength(h.links * 2);
  });
  it('fills the opening between the rails with the centre link, clear of the crossbar', () => {
    // Flat, so the wrist curve doesn't tilt the pieces' bounds into each other.
    const flat = hLinkBracelet({ ...h, wristRadius: 1e6 }, { y: 24, z: 2 }, { center: 'bracelet', outer: 'bracelet' });
    const [left, right, bar, center] = flat.slice(0, 4).map((l) => box([l]));
    expect(center!.min.x).toBeGreaterThan(left!.max.x);
    expect(center!.max.x).toBeLessThan(right!.min.x);
    expect(bar!.min.y).toBeGreaterThan(center!.max.y);
    expect(right!.max.x - left!.min.x).toBeCloseTo(h.startWidth, 1);
    expect((center!.max.x - center!.min.x) / h.startWidth).toBeCloseTo(h.centerRatio, 1);
  });
  it('starts at the given point and curves toward the wrist', () => {
    expect(Math.min(...first.map((l) => box([l]).min.y))).toBeCloseTo(24, 1);
    expect(box(layers).max.z).toBeGreaterThan(6);
  });
});
