import { describe, expect, it } from 'vitest';
import { extrudePlan, polygonSdf, type P2 } from './sdf';

// An L: the notch at (1..4, 1..4) is outside.
const L: P2[] = [[0, 0], [4, 0], [4, 1], [1, 1], [1, 4], [0, 4]];

describe('polygonSdf', () => {
  const d = polygonSdf(L);
  it('is negative inside and positive in the concave notch', () => {
    expect(d(0.5, 0.5)).toBeCloseTo(-0.5, 6);
    expect(d(0.5, 2)).toBeCloseTo(-0.5, 6);
    // Nearest boundary point from inside the notch is the perpendicular foot on one of the two edges meeting
    // at the reflex corner (1, 1), not the corner itself: (2, 2) projects inside both edges' ranges.
    expect(d(2, 2)).toBeCloseTo(1, 6);
    expect(d(5, 0.5)).toBeCloseTo(1, 6);
  });
  it('does not depend on winding', () => {
    const r = polygonSdf([...L].reverse());
    for (const [x, y] of [[0.5, 0.5], [2, 2], [5, 0.5], [0.2, 3.9]] as P2[]) expect(r(x, y)).toBeCloseTo(d(x, y), 9);
  });
});

describe('extrudePlan', () => {
  const circle = (x: number, y: number) => Math.hypot(x, y) - 5;
  const s = extrudePlan(circle, { front: 0, back: 3, chamfer: 0.5, backChamfer: 0.3, edge: 0.1 });
  it('fills the outline between the front and back faces', () => {
    expect(s(0, 0, 1.5)).toBeLessThan(0);
    expect(s(4.9, 0, 1.5)).toBeLessThan(0);
    expect(s(0, 0, -0.1)).toBeGreaterThan(0);
    expect(s(0, 0, 3.1)).toBeGreaterThan(0);
    expect(s(5.1, 0, 1.5)).toBeGreaterThan(0);
  });
  it('cuts a chamfer along the front edge', () => {
    // Inside the outline and behind the front face, but within the 0.5 mm bevel.
    expect(s(4.9, 0, 0.05)).toBeGreaterThan(0);
  });
});
