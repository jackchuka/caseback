import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { outlineShape } from './outline';
import { polygonSdf } from './sdf';

const area = (s: THREE.Shape) => THREE.ShapeUtils.area(s.getPoints());

describe('outlineShape', () => {
  it('traces a circle to within 1 % of its area, counter-clockwise', () => {
    const s = outlineShape((x, y) => Math.hypot(x, y) - 5, [-6, -6], [6, 6], 0.1);
    expect(area(s)).toBeGreaterThan(0);
    expect(Math.abs(area(s) - Math.PI * 25) / (Math.PI * 25)).toBeLessThan(0.01);
  });
  it('keeps a concave outline concave', () => {
    const L = polygonSdf([[0, 0], [4, 0], [4, 1], [1, 1], [1, 4], [0, 4]]);
    const s = outlineShape(L, [-1, -1], [5, 5], 0.05);
    expect(Math.abs(area(s) - 7) / 7).toBeLessThan(0.02);
  });
  it('keeps only the largest loop', () => {
    const two = (x: number, y: number) => Math.min(Math.hypot(x + 3, y) - 2, Math.hypot(x - 3, y) - 1);
    const s = outlineShape(two, [-6, -3], [5, 3], 0.05);
    expect(Math.abs(area(s) - Math.PI * 4) / (Math.PI * 4)).toBeLessThan(0.02);
  });
});
