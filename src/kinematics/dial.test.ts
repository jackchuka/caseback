import { describe, expect, it } from 'vitest';
import { buildSolver } from './solver';
import { miniCaliber } from '../test/fixtures';
import type { Caliber } from '../model/schema';

const TAU = Math.PI * 2;
const est = { confidence: 'estimated' as const, sourceIds: [] };

// mini caliber + dial side: w1 (1 rpm) drives a 6-leaf center pinion (20 rpm), which the cannon pinion follows.
function dialCaliber(): Caliber {
  const c = miniCaliber();
  c.parts.push(
    { id: 'center', arbor: 'center', mechanism: 'going-train', side: 'back', pos: { x: 0, y: 0, z: 1.5 }, explode: { dz: 0 }, material: 'gilt', provenance: est, shape: { kind: 'pinion', leaves: 6, module: 0.1, length: 0.5 } },
    { id: 'cannon', arbor: 'cannon', mechanism: 'motion-works', side: 'dial', pos: { x: 0, y: 0, z: -1.6 }, explode: { dz: -2 }, material: 'steel', provenance: est, shape: { kind: 'pinion', leaves: 12, module: 0.1, length: 0.8 } },
    { id: 'minute-hand', arbor: 'cannon', mechanism: 'motion-works', side: 'dial', pos: { x: 0, y: 0, z: -3.2 }, explode: { dz: -7 }, material: 'blued', provenance: est, shape: { kind: 'hand', length: 9.6, width: 0.32, thickness: 0.08 } },
    { id: 'minute-wheel', arbor: 'mw', mechanism: 'motion-works', side: 'dial', pos: { x: 2.4, y: 0, z: -1.6 }, explode: { dz: -3 }, material: 'gilt', provenance: est, shape: { kind: 'wheel', teeth: 36, module: 0.1, thickness: 0.18, spokes: 0 } },
    { id: 'minute-pinion', arbor: 'mw', mechanism: 'motion-works', side: 'dial', pos: { x: 2.4, y: 0, z: -2.05 }, explode: { dz: -3 }, material: 'steel', provenance: est, shape: { kind: 'pinion', leaves: 10, module: 0.096, length: 0.6 } },
    { id: 'hour-wheel', arbor: 'hour', mechanism: 'motion-works', side: 'dial', pos: { x: 0, y: 0, z: -2.05 }, explode: { dz: -4 }, material: 'gilt', provenance: est, shape: { kind: 'wheel', teeth: 40, module: 0.096, thickness: 0.16, spokes: 4 } },
    { id: 'hour-hand', arbor: 'hour', mechanism: 'motion-works', side: 'dial', pos: { x: 0, y: 0, z: -2.9 }, explode: { dz: -6 }, material: 'blued', provenance: est, shape: { kind: 'hand', length: 6.2, width: 0.42, thickness: 0.08 } },
    { id: 'date-driver', arbor: 'dd', mechanism: 'calendar', side: 'dial', pos: { x: -5, y: 2.9, z: -2.05 }, explode: { dz: -3 }, material: 'gilt', provenance: est, shape: { kind: 'date-driver', teeth: 80, module: 0.096, thickness: 0.16, fingerLength: 3.4 } },
    { id: 'date-ring', mechanism: 'calendar', side: 'dial', pos: { x: 0, y: 0, z: -2.35 }, explode: { dz: -1.6 }, material: 'plate', provenance: est, shape: { kind: 'date-ring', teeth: 31, innerRadius: 9.3, outerRadius: 12.3, thickness: 0.16 } },
  );
  c.couplings.push(
    { type: 'mesh', a: 'w1', b: 'center' },
    { type: 'slip', a: 'center', b: 'cannon' },
    { type: 'mesh', a: 'cannon', b: 'minute-wheel' },
    { type: 'mesh', a: 'minute-pinion', b: 'hour-wheel' },
    { type: 'mesh', a: 'hour-wheel', b: 'date-driver' },
    { type: 'intermittent', driver: 'date-driver', driven: 'date-ring' },
  );
  return c;
}

describe('dial side kinematics', () => {
  const c = dialCaliber();
  const solve = buildSolver(c);
  const a = (t: number, id: string, dateBase = 0) => solve({ t, explode: 0, dateBase }).get(id)!.angle;
  const perMinute = Math.abs(a(60, 'minute-hand') - a(0, 'minute-hand')) / TAU;

  it('cannon pinion follows its slip partner 1:1', () => {
    expect(a(12.5, 'cannon')).toBeCloseTo(a(12.5, 'center'));
  });
  it('hour hand turns 1/12 of the minute hand, same direction', () => {
    const dm = a(60, 'minute-hand') - a(0, 'minute-hand');
    const dh = a(60, 'hour-hand') - a(0, 'hour-hand');
    expect(dh).toBeCloseTo(dm / 12);
  });
  it('date driver turns at half the hour wheel', () => {
    const dh = a(60, 'hour-wheel') - a(0, 'hour-wheel');
    const dd = a(60, 'date-driver') - a(0, 'date-driver');
    expect(Math.abs(dd)).toBeCloseTo(Math.abs(dh) / 2);
    expect(perMinute).toBeGreaterThan(0);
  });
});

describe('date ring (intermittent)', () => {
  const c = dialCaliber();
  const solve = buildSolver(c);
  // seconds for one date-driver turn in this fixture
  const one = (() => {
    const d = Math.abs(solve({ t: 60, explode: 0 }).get('date-driver')!.angle - solve({ t: 0, explode: 0 }).get('date-driver')!.angle) / TAU;
    return 60 / d;
  })();
  const ring = (t: number, dateBase = 0) => solve({ t, explode: 0, dateBase }).get('date-ring')!.angle;

  it('stays put outside the change window', () => {
    expect(ring(0.1 * one)).toBeCloseTo(ring(0.8 * one));
  });
  it('date ring lands on whole days', () => {
    for (const days of [1, 2, 7, 40]) {
      expect(Math.abs(ring(days * one + 0.01 * one) - ring(0.01 * one))).toBeCloseTo((days * TAU) / 31, 6);
    }
  });
  it('starts at the given date', () => {
    expect(Math.abs(ring(0, 9) - ring(0, 0))).toBeCloseTo((9 * TAU) / 31);
  });
});
