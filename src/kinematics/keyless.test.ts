import { describe, expect, it } from 'vitest';
import { buildSolver } from './solver';
import { getCaliber } from '../../data/calibers';

const TAU = Math.PI * 2;
const c = getCaliber('eta-2824-2')!;
const solve = buildSolver(c);
const at = (input: Parameters<typeof solve>[0], id: string) => solve(input).get(id)!;

describe('keyless works', () => {
  it('setting moves the hands but not the train', () => {
    const base = { t: 1000, explode: 0, crownPos: 2 as const };
    const a = (setRot: number, id: string) => at({ ...base, setRot }, id).angle;
    expect(a(TAU, 'center-wheel')).toBe(a(0, 'center-wheel'));
    expect(a(TAU, 'escape-wheel')).toBe(a(0, 'escape-wheel'));
    expect(a(TAU, 'minute-hand')).not.toBeCloseTo(a(0, 'minute-hand'));
    const dm = a(TAU, 'minute-hand') - a(0, 'minute-hand');
    const dh = a(TAU, 'hour-hand') - a(0, 'hour-hand');
    expect(dh).toBeCloseTo(dm / 12);
  });
  it('quick-set snaps to whole dates', () => {
    const ring = (quickRot: number) => at({ t: 60, explode: 0, crownPos: 1, quickRot }, 'date-ring').angle;
    expect(Math.abs(ring(TAU) - ring(0))).toBeCloseTo(TAU / 31);
    expect(Math.abs(ring(0.3 * TAU) - ring(0))).toBeCloseTo(0);
    expect(Math.abs(ring(2 * TAU) - ring(0))).toBeCloseTo((2 * TAU) / 31);
  });
  it('pulls the stem and moves the sliding pinion with the crown position', () => {
    expect(at({ t: 0, explode: 0, crownPos: 0 }, 'stem').dx).toBe(0);
    expect(at({ t: 0, explode: 0, crownPos: 2 }, 'stem').dx).toBeCloseTo(1.4);
    expect(at({ t: 0, explode: 0, crownPos: 2 }, 'sliding-pinion').dx).toBeLessThan(at({ t: 0, explode: 0, crownPos: 0 }, 'sliding-pinion').dx + 1.4);
    expect(at({ t: 0, explode: 0, crownRot: 1.5 }, 'stem').angle).toBe(1.5);
    expect(at({ t: 0, explode: 0, windRot: 2 }, 'winding-pinion').angle).toBe(2);
  });
  it('leaves the M0-M3 invariants intact', () => {
    const turns = (id: string, s: number) => Math.abs(at({ t: s, explode: 0 }, id).angle - at({ t: 0, explode: 0 }, id).angle) / TAU;
    expect(turns('center-wheel', 3600)).toBeCloseTo(1, 9);
    expect(turns('minute-hand', 3600)).toBeCloseTo(1, 9);
    expect(turns('hour-hand', 43200)).toBeCloseTo(1, 9);
  });
});
