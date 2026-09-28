import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { gearOutline } from './gear';
import { buildShape } from './parts';
import { getCaliber } from '../../data/calibers';

const maxRadius = (g: THREE.BufferGeometry) => {
  const p = g.getAttribute('position');
  let r = 0;
  for (let i = 0; i < p.count; i++) r = Math.max(r, Math.hypot(p.getX(i), p.getY(i)));
  return r;
};

describe('gearOutline', () => {
  it('produces 14 points per tooth and reaches the addendum', () => {
    const s = gearOutline(20, 0.1);
    const pts = s.getPoints();
    expect(pts.length).toBeGreaterThanOrEqual(20 * 14);
    const r = Math.max(...pts.map((p) => Math.hypot(p.x, p.y)));
    expect(r).toBeCloseTo(1 + 1.25 * 0.1, 2);
  });
});

describe('buildShape', () => {
  const c = getCaliber('eta-2824-2')!;
  it('builds finite geometry for every part of the 2824-2', () => {
    for (const part of c.parts) {
      const layers = buildShape(part.shape, part.material);
      expect(layers.length, part.id).toBeGreaterThan(0);
      for (const l of layers) {
        const pos = l.geometry.getAttribute('position');
        expect(pos.count, part.id).toBeGreaterThan(0);
        // One assertion per layer: an expect per coordinate made this test take seconds and time out under load.
        expect(Array.from(pos.array).findIndex((v) => !Number.isFinite(v)), part.id).toBe(-1);
      }
    }
  });
  it('adds a jewel, chaton, screw and slot layer per bridge feature', () => {
    const bridge = c.parts.find((p) => p.id === 'train-bridge')!;
    if (bridge.shape.kind !== 'bridge') throw new Error('expected bridge');
    const layers = buildShape(bridge.shape, bridge.material);
    expect(layers.length).toBe(1 + 2 * bridge.shape.jewels.length + 2 * bridge.shape.screws.length);
    expect(layers.filter((l) => l.material === 'ruby').length).toBe(bridge.shape.jewels.length);
  });
  it('sizes a wheel by its tooth count and module', () => {
    const [layer] = buildShape({ kind: 'wheel', teeth: 80, module: 0.085, thickness: 0.28, spokes: 4 }, 'gilt');
    expect(maxRadius(layer!.geometry)).toBeCloseTo(3.4 + 1.25 * 0.085 + 0.03, 1);
  });
  it('caches identical shapes', () => {
    const shape = { kind: 'pinion' as const, leaves: 10, module: 0.1, length: 0.6 };
    expect(buildShape(shape, 'steel')[0]!.geometry).toBe(buildShape({ ...shape }, 'steel')[0]!.geometry);
  });
  it('builds every hand style with the requested length', () => {
    for (const style of ['leaf', 'sword', 'pencil', 'baton'] as const) {
      const [layer] = buildShape({ kind: 'hand', length: 9.6, width: 0.32, thickness: 0.08, style }, 'blued');
      layer!.geometry.computeBoundingBox();
      expect(-layer!.geometry.boundingBox!.min.y, style).toBeCloseTo(9.6 + 0.25, 0);
    }
  });
});

describe('hand styles differ', () => {
  const outline = (style: 'leaf' | 'sword' | 'pencil' | 'baton') => {
    const [layer] = buildShape({ kind: 'hand', length: 9.6, width: 0.32, thickness: 0.08, style }, 'blued');
    layer!.geometry.computeBoundingBox();
    return layer!.geometry;
  };
  it('pencil widens near the tip, baton stays narrow, sword differs from leaf', () => {
    const leaf = outline('leaf');
    expect(outline('pencil').boundingBox!.max.x).toBeGreaterThan(leaf.boundingBox!.max.x);
    expect(outline('baton').boundingBox!.max.x).toBeLessThan(leaf.boundingBox!.max.x);
    expect(outline('sword').getAttribute('position').count).not.toBe(leaf.getAttribute('position').count);
  });
});

describe('Magic Lever and plate shapes', () => {
  const extent = (g: THREE.BufferGeometry) => {
    g.computeBoundingBox();
    return g.boundingBox!;
  };
  it('offsets the eccentric disc by its throw', () => {
    const [cam, pivot] = buildShape({ kind: 'eccentric', radius: 0.4, throw: 0.3, thickness: 0.15 }, 'steel');
    const b = extent(cam!.geometry);
    expect((b.min.x + b.max.x) / 2).toBeCloseTo(0.3, 2);
    expect(b.max.x - b.min.x).toBeCloseTo(0.8, 2);
    expect(pivot!.material).toBe('ruby');
  });
  it('builds a lever that rings the eccentric and reaches past both sides of its wheel', () => {
    const [lever] = buildShape({ kind: 'pawl-lever', length: 8, reach: 1.6, hole: 0.42, width: 0.4, thickness: 0.12 }, 'steel');
    const b = extent(lever!.geometry);
    expect(b.max.x).toBeGreaterThan(8);
    expect(b.max.x).toBeLessThan(8.5);
    expect(b.max.y).toBeGreaterThan(1.6);
    expect(b.min.y).toBeLessThan(-1.6);
    // Nothing of the lever sits between the claws, where the wheel turns.
    const p = lever!.geometry.getAttribute('position');
    for (let i = 0; i < p.count; i++) expect(Math.hypot(p.getX(i) - 8, p.getY(i)), `vertex ${i}`).toBeGreaterThan(1.6 - 0.35);
    // The hub is open for the eccentric (less the edge bevel).
    for (let i = 0; i < p.count; i++) expect(Math.hypot(p.getX(i), p.getY(i))).toBeGreaterThan(0.42 - 0.02);
  });
  it('cuts slots through the plate', () => {
    const [plate] = buildShape({ kind: 'plate', radius: 13, thickness: 1, slots: [{ from: { x: 5, y: 0 }, to: { x: 11, y: 0 }, r: 1 }] }, 'plate');
    const mesh = new THREE.Mesh(plate!.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    const through = (x: number, y: number) => new THREE.Raycaster(new THREE.Vector3(x, y, -5), new THREE.Vector3(0, 0, 1)).intersectObject(mesh).length;
    expect(through(8, 0)).toBe(0);
    expect(through(8, 1.5)).toBeGreaterThan(0);
    expect(through(-8, 0)).toBeGreaterThan(0);
  });
});
