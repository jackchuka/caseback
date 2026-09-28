import { describe, expect, it } from 'vitest';
import { sampled2d } from './field2d';
import { polygonSdf } from './sdf';

describe('sampled2d', () => {
  const exact = polygonSdf([[-3, -2], [4, -2], [4, 3], [-3, 3]]);
  const table = sampled2d(exact, [-5, -5], [5, 5], 0.05);
  it('reads the field back within a fraction of its step', () => {
    for (const [x, y] of [[0, 0], [3.97, 1.2], [-2.99, -1.9], [4.3, 3.2], [-4.9, 4.9]] as const) expect(Math.abs(table(x, y) - exact(x, y))).toBeLessThan(0.02);
  });
  it('falls back to the exact field outside the grid', () => {
    expect(table(9, 9)).toBe(exact(9, 9));
  });
});
