import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { cutFlutes, fluteCount } from './flutes';

const radii = (g: THREE.BufferGeometry, axis: 'y' | 'z') => {
  const p = g.getAttribute('position');
  return Array.from({ length: p.count }, (_, i) => (axis === 'y' ? Math.hypot(p.getX(i), p.getZ(i)) : Math.hypot(p.getX(i), p.getY(i))));
};

describe('cutFlutes', () => {
  it('cuts grooves only inside the band, about the Y axis', () => {
    const g = cutFlutes(new THREE.CylinderGeometry(4, 4, 4, 160, 8, true), { axis: 'y', radius: 4, count: 40, depth: 0.15, from: -1, to: 1 });
    const p = g.getAttribute('position');
    const inBand: number[] = [], outBand: number[] = [];
    for (let i = 0; i < p.count; i++) (Math.abs(p.getY(i)) <= 1 ? inBand : outBand).push(Math.hypot(p.getX(i), p.getZ(i)));
    expect(Math.min(...inBand)).toBeCloseTo(3.85, 2);
    expect(Math.max(...inBand)).toBeCloseTo(4, 5);
    expect(Math.min(...outBand)).toBeCloseTo(4, 5);
  });
  it('works about the Z axis for a bezel edge', () => {
    const g = cutFlutes(new THREE.CylinderGeometry(20, 20, 1, 480, 4, true).rotateX(Math.PI / 2), { axis: 'z', radius: 20, count: 120, depth: 0.1, from: -0.4, to: 0.4 });
    expect(Math.min(...radii(g, 'z'))).toBeCloseTo(19.9, 2);
  });
  it('spaces flutes about 0.55 mm apart', () => {
    expect(fluteCount(8)).toBe(Math.round((Math.PI * 8) / 0.55));
    expect(fluteCount(2)).toBe(16);
  });
});
