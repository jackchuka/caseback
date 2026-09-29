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

import { settleQuick, snapDates } from './solver';
describe('quick-set release', () => {
  it('settles on a whole date whatever turn it was released at', () => {
    for (const turns of [0.25, 0.6, 0.75, 0.9, 1.67]) {
      let q = turns * TAU;
      for (let i = 0; i < 200; i++) q = settleQuick(q, 1 / 60);
      const d = snapDates(q / TAU);
      expect(d, `released at ${turns}`).toBeCloseTo(Math.round(d), 9);
    }
  });
  it('never moves the date backwards', () => {
    expect(settleQuick(0.6 * TAU, 1 / 60)).toBeGreaterThanOrEqual(0.6 * TAU);
  });
});

describe('a turned stem', () => {
  it('pulls the stem and sliding pinion along its own axis', () => {
    const c = getCaliber('eta-2824-2')!;
    const yaw = -0.4;
    const turned = { ...c, parts: c.parts.map((p) => (p.axis === 'x' ? { ...p, yaw } : p)) };
    const tr = buildSolver(turned)({ t: 0, explode: 0, crownPos: 2 });
    expect(tr.get('stem')!.dx).toBeCloseTo(2 * 0.7 * Math.cos(yaw), 9);
    expect(tr.get('stem')!.dy).toBeCloseTo(2 * 0.7 * Math.sin(yaw), 9);
    const slide = 2 * 0.7 - 1.05;
    expect(tr.get('sliding-pinion')!.dx).toBeCloseTo(slide * Math.cos(yaw), 9);
    expect(tr.get('sliding-pinion')!.dy).toBeCloseTo(slide * Math.sin(yaw), 9);
  });
  it('leaves an unturned stem moving along X only', () => {
    const tr = buildSolver(getCaliber('eta-2824-2')!)({ t: 0, explode: 0, crownPos: 1 });
    expect(tr.get('stem')!.dy).toBe(0);
  });
});
