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
