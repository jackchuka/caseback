import { describe, expect, it } from 'vitest';
import { caseRadii } from './caseGeometry';
import { watches } from '../../data/watches';
describe('caseRadii', () => {
  it('keeps the default case without a watch', () => {
    expect(caseRadii(25.6)).toEqual({ inner: 13.15, outer: 16.3, height: 7.8, bottom: -2.8 });
  });
  it('never clips the movement', () => {
    for (const w of Object.values(watches)) {
      const r = caseRadii(25.6, w.exterior);
      expect(r.inner).toBeGreaterThanOrEqual(12.8 + 0.35);
      expect(r.outer).toBeCloseTo(w.exterior.case.diameterMm / 2);
    }
  });
});

import { bezelProfile, casingRing, stemExtension } from './caseGeometry';
describe('case fit', () => {
  it('fills the gap between the movement and the case wall', () => {
    for (const w of Object.values(watches)) {
      const { inner } = caseRadii(25.6, w.exterior);
      const ring = casingRing(12.8, inner);
      expect(ring, w.id).not.toBeNull();
      expect(ring!.rIn).toBeLessThanOrEqual(12.9);
      expect(ring!.rOut).toBeCloseTo(inner);
    }
    expect(casingRing(12.8, 13.15)).toBeNull();
  });
  it('extends the stem to the crown', () => {
    const e = stemExtension(16.1, 22.3, 4);
    expect(e.from).toBe(16.1);
    expect(e.to).toBeCloseTo(20.3);
    expect(stemExtension(16.1, 17.1, 2).to).toBeGreaterThanOrEqual(16.1);
  });
  it('keeps the bezel clear of the case bottom face', () => {
    const prof = bezelProfile(20.5, -2.8);
    expect(Math.max(...prof.map(([, z]) => z))).toBeLessThanOrEqual(-2.82);
  });
});
