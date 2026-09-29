import { describe, expect, it } from 'vitest';
import { calibers } from '../../../data/calibers';
import { movementFrame } from './frame';

describe('movementFrame', () => {
  const c = calibers['eta-2824-2']!;
  it('reports an unturned stem as stemAngle 0', () => {
    expect(movementFrame(c).stemAngle).toBe(0);
  });
  it('reports a turned stem\'s angle and measures its end along it', () => {
    const yaw = -0.4;
    const turned = c.parts.map((p) => (p.axis === 'x' ? { ...p, yaw, pos: { ...p.pos, x: p.pos.x * Math.cos(yaw), y: p.pos.x * Math.sin(yaw) } } : p));
    const f = movementFrame({ ...c, parts: turned });
    expect(f.stemAngle).toBe(yaw);
    expect(f.stemEnd).toBeCloseTo(16.1, 6);
  });
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
  it('gives a time-only caliber no day window, extra hands or pushers', () => {
    const f = movementFrame(c);
    expect(f.dayWindow).toBeNull();
    expect(f.extraHands).toEqual([]);
    expect(f.pushers).toEqual([]);
  });
  it('reads a chronograph\'s day window, sub-dial and chronograph hands and pushers', () => {
    const f = movementFrame(calibers['valjoux-7750']!);
    expect(f.dayWindow!.x).toBeCloseTo(1.6 + 0.72 * 7.2, 6);
    expect(f.dayWindow!.x + f.dayWindow!.width / 2).toBeLessThan(f.dateWindow!.x - f.dateWindow!.width / 2);
    expect(f.extraHands.map((h) => h.id).sort()).toEqual(['chrono-seconds-hand', 'hour-counter-hand', 'minute-counter-hand', 'seconds-hand']);
    expect(f.extraHands.find((h) => h.id === 'seconds-hand')).toMatchObject({ x: -8.2, y: 0 });
    expect(f.pushers.map((p) => p.action)).toEqual(['start-stop', 'reset']);
  });
  it('leaves a centre seconds hand out of the extra hands', () => {
    const hand = c.parts.find((p) => p.id === 'hour-hand')!;
    const f = movementFrame({ ...c, parts: [...c.parts, { ...hand, id: 'seconds-hand', arbor: 'fourth' }] });
    expect(f.extraHands).toEqual([]);
  });
  it('needs an hour hand to place the dial', () => {
    expect(() => movementFrame({ ...c, parts: c.parts.filter((p) => p.id !== 'hour-hand') })).toThrow(/hour-hand/);
  });
  it('reaches as far as the movement, or a wider dial-side module', () => {
    expect(movementFrame(c).outerRadius).toBe(12.8);
    expect(movementFrame({ ...c, exterior: { ...c.exterior, moduleDiameterMm: 32 } }).outerRadius).toBe(16);
  });
});
