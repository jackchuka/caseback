import { describe, expect, it } from 'vitest';
import { calibers } from '../../../data/calibers';
import { movementFrame } from './frame';

describe('movementFrame', () => {
  const c = calibers['eta-2824-2']!;
  it('reads the ETA 2824-2 heights and date window from its parts', () => {
    const f = movementFrame(c);
    expect(f.diameterMm).toBe(25.6);
    expect(f.frontZ).toBe(-2.8);
    expect(f.secondsZ).toBe(-3.5);
    // Halfway between the date ring (−2.35) and the hour hand (−2.95).
    expect(f.dialZ).toBeCloseTo(-2.65, 6);
    expect(f.stemZ).toBe(-1.5);
    expect(f.stemEnd).toBeCloseTo(16.1, 6);
    expect(f.stemRadius).toBe(0.26);
    expect(f.dateWindow!.x).toBeCloseTo(10.8, 6);
    expect(f.dateWindow).toMatchObject({ width: 2.4, height: 1.8 });
  });
  it('reports the plate dial face and the rotor back', () => {
    const f = movementFrame(c);
    expect(f.plateFrontZ).toBeCloseTo(-1.15, 6);
    expect(f.rotorBackZ - f.plateFrontZ).toBeGreaterThan(4.3);
    expect(f.rotorBackZ - f.plateFrontZ).toBeLessThan(4.9);
  });
  it('gives a caliber without a date ring no window and a dial just in front of the hour wheel', () => {
    const f = movementFrame({ ...c, parts: c.parts.filter((p) => p.shape.kind !== 'date-ring') });
    expect(f.dateWindow).toBeNull();
    expect(f.dialZ).toBeCloseTo(-2.6, 6);
  });
  it('reports a caliber without a stem', () => {
    const f = movementFrame({ ...c, parts: c.parts.filter((p) => p.shape.kind !== 'stem') });
    expect(f.stemEnd).toBeNull();
  });
  it('needs an hour hand to place the dial', () => {
    expect(() => movementFrame({ ...c, parts: c.parts.filter((p) => p.id !== 'hour-hand') })).toThrow(/hour-hand/);
  });
});
