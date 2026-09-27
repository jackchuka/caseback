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
