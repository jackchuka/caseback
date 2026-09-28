import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { presageHands } from './hands';
import { P } from './params';

const extent = (ls: { geometry: THREE.BufferGeometry }[]) => {
  const b = new THREE.Box3();
  for (const l of ls) { l.geometry.computeBoundingBox(); b.union(l.geometry.boundingBox!); }
  return b;
};

describe('Presage SRPB43 hands', () => {
  const rd = P.dialRadius;
  const h = presageHands(rd);
  it('reaches the indices, the minute track and near the dial edge', () => {
    expect(-extent(h.hour).min.y / rd).toBeCloseTo(P.hour, 2);
    expect(-extent(h.minute).min.y / rd).toBeCloseTo(P.minute, 2);
    expect(-extent(h.seconds).min.y).toBeLessThan(rd);
  });
  it('facets the dauphine hands: a ridge along the axis stands proud of the edges', () => {
    for (const hand of [h.hour, h.minute]) {
      const roof = hand[1]!.geometry;
      const p = roof.getAttribute('position');
      let ridge = 0, edge = 0;
      for (let i = 0; i < p.count; i++) {
        if (Math.abs(p.getX(i)) < 1e-6) ridge = Math.min(ridge, p.getZ(i));
        else edge = Math.min(edge, p.getZ(i));
      }
      expect(edge - ridge).toBeCloseTo(P.handRidge, 5);
      const n = roof.getAttribute('normal');
      for (let i = 0; i < n.count; i++) expect(n.getZ(i)).toBeLessThan(0);
    }
  });
  it('carries an open lozenge on the seconds hand\'s tail', () => {
    const lozenge = extent([h.seconds[1]!]);
    expect((lozenge.min.y + lozenge.max.y) / 2).toBeCloseTo(P.lozenge.at * rd, 5);
    expect(lozenge.max.x).toBeCloseTo(P.lozenge.across, 5);
    expect(extent(h.seconds).max.y).toBeCloseTo(P.secondsTail * rd, 5);
  });
  it('uses movement materials only: steel hour and minute hands, a blued seconds hand', () => {
    for (const l of [...h.hour, ...h.minute]) expect(l.material).toBe('steel');
    for (const l of h.seconds) expect(l.material).toBe('blued');
  });
});
