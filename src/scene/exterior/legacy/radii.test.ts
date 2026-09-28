import { describe, expect, it } from 'vitest';
import { calibers } from '../../../../data/calibers';
import { legacyConfigs } from './configs';
import { casingRing } from '../../caseGeometry';
import { movementFrame } from '../frame';
import { bezelProfile, caseRadii } from './radii';

const FRAME = movementFrame(calibers['eta-2824-2']!);

describe('caseRadii', () => {
  it('never clips the movement', () => {
    for (const [id, e] of Object.entries(legacyConfigs)) {
      const r = caseRadii(FRAME, e);
      expect(r.inner).toBeGreaterThanOrEqual(12.8 + 0.35);
      expect(r.outer, id).toBeCloseTo(e.case.diameterMm / 2);
    }
  });
  it('fills the gap between the movement and the case wall', () => {
    for (const [id, e] of Object.entries(legacyConfigs)) {
      const { inner } = caseRadii(FRAME, e);
      const ring = casingRing(12.8, inner);
      expect(ring, id).not.toBeNull();
      expect(ring!.rIn).toBeLessThanOrEqual(12.9);
      expect(ring!.rOut).toBeCloseTo(inner);
    }
  });
  it('keeps the bezel clear of the case bottom face', () => {
    const prof = bezelProfile(20.5, -2.8);
    expect(Math.max(...prof.map(([, z]) => z))).toBeLessThanOrEqual(-2.82);
  });
});
