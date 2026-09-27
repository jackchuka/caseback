import { describe, expect, it } from 'vitest';
import { OPENING_DURATION, openingPose } from './opening';

describe('openingPose', () => {
  it('starts closed', () => {
    expect(openingPose(0)).toEqual({ casebackAngle: 0, casebackLift: 0, casebackOpacity: 1, rotorLift: 0, rotorSlide: 0, done: false });
  });
  it('unscrews before lifting away', () => {
    const p = openingPose(1.0);
    expect(p.casebackAngle).toBeLessThan(-0.5);
    expect(p.casebackOpacity).toBe(1);
  });
  it('ends with the caseback gone and the rotor out of the way', () => {
    const p = openingPose(OPENING_DURATION);
    expect(p.done).toBe(true);
    expect(p.casebackOpacity).toBe(0);
    expect(p.rotorSlide).toBeGreaterThan(20);
  });
});
