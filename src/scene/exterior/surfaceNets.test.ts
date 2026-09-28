import { describe, expect, it } from 'vitest';
import { closedAndOutward } from './meshCheck';
import { surfaceNets } from './surfaceNets';

describe('surfaceNets', () => {
  const sphere = (x: number, y: number, z: number) => Math.hypot(x, y, z) - 5;
  const g = surfaceNets(sphere, [-6, -6, -6], [6, 6, 6], 0.25);

  it('puts every vertex on the surface', () => {
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) expect(Math.abs(Math.hypot(p.getX(i), p.getY(i), p.getZ(i)) - 5)).toBeLessThan(0.02);
  });

  it('is closed and faces outward with the right volume', () => {
    const { open, volume } = closedAndOutward(g);
    expect(open).toBe(0);
    expect(volume).toBeCloseTo((4 / 3) * Math.PI * 125, -1);
  });

  it('gives normals that point away from the inside', () => {
    const p = g.getAttribute('position');
    const n = g.getAttribute('normal');
    for (let i = 0; i < p.count; i += 97) {
      const d = p.getX(i) * n.getX(i) + p.getY(i) * n.getY(i) + p.getZ(i) * n.getZ(i);
      expect(d).toBeGreaterThan(4.9);
    }
  });
});
