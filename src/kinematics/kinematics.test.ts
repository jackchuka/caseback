import { describe, expect, it } from 'vitest';
import { centerDistance, pitchRadius, place, smoothstep } from './gearMath';
import { BALANCE_AMPLITUDE, escapementState } from './escapement';
import { buildSolver } from './solver';
import { miniCaliber } from '../test/fixtures';

const TAU = Math.PI * 2;

describe('gearMath', () => {
  it('computes pitch radius and center distance', () => {
    expect(pitchRadius(80, 0.1)).toBeCloseTo(4);
    expect(centerDistance(0.1, 80, 10)).toBeCloseTo(4.5);
  });
  it('places a point at an angle', () => {
    const p = place({ x: 1, y: 1 }, 2, 90);
    expect(p.x).toBeCloseTo(1);
    expect(p.y).toBeCloseTo(3);
  });
  it('smoothstep clamps', () => {
    expect(smoothstep(-1)).toBe(0);
    expect(smoothstep(2)).toBe(1);
    expect(smoothstep(0.5)).toBeCloseTo(0.5);
  });
});

describe('escapementState', () => {
  it('oscillates the balance at vph/7200 Hz', () => {
    expect(escapementState(0, 28800, 20).balance).toBeCloseTo(0);
    expect(escapementState(1 / 16, 28800, 20).balance).toBeCloseTo(BALANCE_AMPLITUDE);
  });
  it('advances the escape wheel half a tooth per beat', () => {
    const a = escapementState(0, 28800, 20).escape;
    const b = escapementState(1, 28800, 20).escape; // 8 beats
    expect(Math.abs(b - a)).toBeCloseTo((8 * Math.PI) / 20);
  });
  it('flips the pallet fork every beat', () => {
    const f0 = escapementState(0.2 / 8, 28800, 20).fork;
    const f1 = escapementState(1.2 / 8, 28800, 20).fork;
    expect(Math.sign(f0)).toBe(-Math.sign(f1));
  });
});

describe('buildSolver', () => {
  const solve = buildSolver(miniCaliber());
  const angle = (t: number, id: string) => solve({ t, explode: 0 }).get(id)!.angle;

  it('turns the escape arbor at vph / (60 * 2 * teeth) rpm', () => {
    expect(Math.abs(angle(60, 'escw') - angle(0, 'escw'))).toBeCloseTo(12 * TAU);
  });
  it('propagates through meshes with the tooth ratio and opposite sign', () => {
    const dEsc = angle(60, 'escw') - angle(0, 'escw');
    const dA = angle(60, 'w1') - angle(0, 'w1');
    expect(Math.abs(dA)).toBeCloseTo(TAU);
    expect(Math.sign(dA)).toBe(-Math.sign(dEsc));
  });
  it('rotates parts on the same arbor together', () => {
    expect(angle(12.34, 'p2')).toBe(angle(12.34, 'escw'));
  });
  it('leaves unconnected parts still', () => {
    expect(angle(100, 'plate')).toBe(0);
  });
  it('scales explode offsets with smoothstep', () => {
    expect(solve({ t: 0, explode: 0 }).get('w1')!.dz).toBe(0);
    expect(solve({ t: 0, explode: 1 }).get('w1')!.dz).toBe(1);
    expect(solve({ t: 0, explode: 1 }).get('plate')!.dz).toBe(-2);
  });
  it('stays exact at large t', () => {
    const t0 = 1e7;
    expect(Math.abs(angle(t0 + 60, 'w1') - angle(t0, 'w1'))).toBeCloseTo(TAU, 6);
  });
});

describe('escapement direction', () => {
  it('turns the pallet fork against the balance during impulse, like meshing parts', () => {
    for (const k of [0, 1, 2, 3]) {
      const t0 = k / 8 + 0.001 / 8;
      const t1 = k / 8 + 0.1 / 8;
      const df = escapementState(t1, 28800, 20).fork - escapementState(t0, 28800, 20).fork;
      const db = escapementState(t1, 28800, 20).balance - escapementState(t0, 28800, 20).balance;
      expect(Math.sign(df), `beat ${k}`).toBe(-Math.sign(db));
    }
  });
});

import { circleIntersection } from './gearMath';
describe('circleIntersection', () => {
  it('finds a point at the given distances from both centers', () => {
    const p = circleIntersection({ x: 0, y: 0 }, 3, { x: 4, y: 0 }, 3, 1);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(3);
    expect(Math.hypot(p.x - 4, p.y)).toBeCloseTo(3);
  });
});
