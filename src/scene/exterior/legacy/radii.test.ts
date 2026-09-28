import { describe, expect, it } from 'vitest';
import { calibers } from '../../../../data/calibers';
import { watches } from '../../../../data/watches';
import { casingRing } from '../../caseGeometry';
import { movementFrame } from '../frame';
import { bezelProfile, caseRadii } from './radii';

const FRAME = movementFrame(calibers['eta-2824-2']!);

describe('caseRadii', () => {
  it('keeps the default case without a watch', () => {
    expect(caseRadii(FRAME)).toEqual({ inner: 13.15, outer: 16.3, height: 7.8, bottom: -2.8 });
  });
  it('never clips the movement', () => {
    for (const w of Object.values(watches)) {
      const r = caseRadii(FRAME, w.exterior);
      expect(r.inner).toBeGreaterThanOrEqual(12.8 + 0.35);
      expect(r.outer).toBeCloseTo(w.exterior.case.diameterMm / 2);
    }
  });
  it('fills the gap between the movement and the case wall', () => {
    for (const w of Object.values(watches)) {
      const { inner } = caseRadii(FRAME, w.exterior);
      const ring = casingRing(12.8, inner);
      expect(ring, w.id).not.toBeNull();
      expect(ring!.rIn).toBeLessThanOrEqual(12.9);
      expect(ring!.rOut).toBeCloseTo(inner);
    }
  });
  it('keeps the bezel clear of the case bottom face', () => {
    const prof = bezelProfile(20.5, -2.8);
    expect(Math.max(...prof.map(([, z]) => z))).toBeLessThanOrEqual(-2.82);
  });
});
