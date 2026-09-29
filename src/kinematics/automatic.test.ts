import { describe, expect, it } from 'vitest';
import { buildSolver } from './solver';
import { accumulateWinding, reserveHours, throttle, wristSwing } from './winding';
import { miniCaliber } from '../test/fixtures';
import type { Caliber } from '../model/schema';

const est = { confidence: 'estimated' as const, sourceIds: [] };
const base = { side: 'back' as const, explode: { dz: 0 }, material: 'gilt' as const, provenance: est };

function autoCaliber(): Caliber {
  const c = miniCaliber();
  c.parts.push(
    { ...base, id: 'rotor', arbor: 'rotor', mechanism: 'automatic', pos: { x: 0, y: 0, z: 4.45 }, shape: { kind: 'rotor', radius: 12, hub: 1.2, thickness: 0.45 } },
    { ...base, id: 'rotor-pinion', arbor: 'rotor', mechanism: 'automatic', pos: { x: 0, y: 0, z: 4.1 }, shape: { kind: 'pinion', leaves: 12, module: 0.1, length: 0.5 } },
    { ...base, id: 'rev-a', focus: 'reversers', mechanism: 'automatic', pos: { x: 1.5, y: 0, z: 4.1 }, shape: { kind: 'wheel', teeth: 18, module: 0.1, thickness: 0.16, spokes: 0 } },
    { ...base, id: 'rev-b', focus: 'reversers', mechanism: 'automatic', pos: { x: 3.1, y: 0, z: 4.1 }, shape: { kind: 'wheel', teeth: 14, module: 0.1, thickness: 0.16, spokes: 0 } },
    { ...base, id: 'red-wheel', arbor: 'red', mechanism: 'automatic', pos: { x: 4.9, y: 0, z: 4.1 }, shape: { kind: 'wheel', teeth: 22, module: 0.1, thickness: 0.16, spokes: 0 } },
    { ...base, id: 'red-pinion', arbor: 'red', mechanism: 'automatic', pos: { x: 4.9, y: 0, z: 3.95 }, shape: { kind: 'pinion', leaves: 9, module: 0.12, length: 0.4 } },
    { ...base, id: 'ratchet', mechanism: 'power', pos: { x: 4.9, y: 3.54, z: 3.95 }, shape: { kind: 'ratchet', teeth: 50, module: 0.12, thickness: 0.28 } },
  );
  c.couplings.push(
    { type: 'mesh', a: 'rotor-pinion', b: 'rev-a' },
    { type: 'one-way', input: 'rev-a', output: 'rev-b' },
    { type: 'mesh', a: 'rev-b', b: 'red-wheel' },
    { type: 'mesh', a: 'red-pinion', b: 'ratchet' },
  );
  return c;
}

describe('automatic winding kinematics', () => {
  const c = autoCaliber();
  const solve = buildSolver(c);
  const at = (rotor: number, wound: number, id: string) => solve({ t: 0, explode: 0, rotor, wound }).get(id)!.angle;

  it('drives the first reversing wheel from the rotor', () => {
    expect(at(1, 0, 'rev-a')).toBeCloseTo(-12 / 18);
  });
  it('drives the train after the one-way from the wound angle only', () => {
    expect(at(5, 0, 'rev-b')).toBe(0);
    expect(at(0, 1, 'rev-b')).toBe(1);
    expect(at(0, 1, 'ratchet')).toBeCloseTo((-14 / 22) * (-9 / 50));
  });
  it('exposes the one-way ratio and ratchet factor', () => {
    expect(solve.info.oneWay).toEqual({ inputKey: 'rev-a', outputKey: 'rev-b', ratio: 18 / 14 });
    expect(solve.info.ratchetFactor).toBeCloseTo((-14 / 22) * (-9 / 50));
  });
  it('parts sharing a focus but not an arbor turn independently', () => {
    expect(at(1, 0, 'rev-a')).not.toBe(at(1, 0, 'rev-b'));
  });
});

describe('winding and reserve', () => {
  it('winding grows for both directions', () => {
    let w = 0;
    w = accumulateWinding(w, 0, 1, 2);
    w = accumulateWinding(w, 1, -0.5, 2);
    expect(w).toBeCloseTo(2 + 3);
  });
  it('adds one barrel turn of hours per ratchet turn and drains in real time', () => {
    const c = autoCaliber();
    c.parts.push(); // mini caliber has no barrel; reserveHours falls back to 1 h per turn
    expect(reserveHours(c, 1, 0, 10)).toBeCloseTo(11);
    expect(reserveHours(c, 0, 3600, 10)).toBeCloseTo(9);
  });
  it('reserve is clamped', () => {
    const c = autoCaliber();
    expect(reserveHours(c, 1e6, 0, 10)).toBe(c.specs.powerReserveH);
    expect(reserveHours(c, 0, 1e9, 10)).toBe(0);
  });
  it('wrist swing stays within ±2.5 rad and moves', () => {
    const xs = Array.from({ length: 200 }, (_, i) => wristSwing(i * 0.1));
    expect(Math.max(...xs.map(Math.abs))).toBeLessThanOrEqual(2.5);
    expect(new Set(xs.map((x) => x.toFixed(3))).size).toBeGreaterThan(50);
  });
  it('throttles to one tick per interval', () => {
    const tick = throttle(250);
    expect(tick(0)).toBe(true);
    expect(tick(100)).toBe(false);
    expect(tick(260)).toBe(true);
  });
});

import { hoursPerBarrelTurn, stepReserve } from './winding';
import { buildShape } from '../geometry/parts';
describe('integrated reserve', () => {
  const c = autoCaliber();
  const perTurn = hoursPerBarrelTurn(c);
  it('never builds hidden debt: after draining past 0, winding raises it immediately', () => {
    let r = 1;
    r = stepReserve(c, perTurn, r, 0, 10 * 3600);
    expect(r).toBe(0);
    r = stepReserve(c, perTurn, r, 0.5, 0);
    expect(r).toBeGreaterThan(0);
  });
  it('never builds hidden surplus above the maximum', () => {
    let r = stepReserve(c, perTurn, 37, 100, 0);
    expect(r).toBe(c.specs.powerReserveH);
    r = stepReserve(c, perTurn, r, 0, 3600);
    expect(r).toBeCloseTo(c.specs.powerReserveH - 1);
  });
});

describe('wheel arbors', () => {
  it('only spoked wheels carry a long arbor pin', () => {
    expect(buildShape({ kind: 'wheel', teeth: 18, module: 0.1, thickness: 0.16, spokes: 0 }, 'gilt')).toHaveLength(1);
    expect(buildShape({ kind: 'wheel', teeth: 80, module: 0.085, thickness: 0.28, spokes: 4 }, 'gilt')).toHaveLength(2);
  });
});
