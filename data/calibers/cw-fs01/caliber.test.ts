import { describe, expect, it } from 'vitest';
import { calibers } from '../index';
import { caliberKit, TAU } from '../testkit';
import { centerDistance } from '../../../src/kinematics/gearMath';
import { toothCount } from '../../../src/model/validate';

const { c, solve, part, angle, turns } = caliberKit('cw-fs01');
const strike = c.couplings.find((cp) => cp.type === 'strike')!;
if (strike.type !== 'strike') throw new Error('strike');
const HOUR = 10 * 3600;
// Hammer angles measured toward the gong: the swing's sign is the direction of the blow.
const reach = Math.abs(strike.swing);
const toward = (a: number) => Math.sign(strike.swing) * a;
// The hammer outline turned `a` about its pivot, in movement coordinates; its farthest reach from the gong's centre.
const hammerPoints = (a: number) => {
  const h = part('hammer');
  if (h.shape.kind !== 'lever') throw new Error('hammer');
  const [c, s] = [Math.cos(a), Math.sin(a)];
  return h.shape.outline.map((p) => ({ x: h.pos.x + p.x * c - p.y * s, y: h.pos.y + p.x * s + p.y * c }));
};
const gongDist = (p: { x: number; y: number }) => Math.hypot(p.x - part('gong').pos.x, p.y - part('gong').pos.y);
const headPoint = (a: number) => hammerPoints(a).reduce((m, p) => (gongDist(p) > gongDist(m) ? p : m));
const headReach = (a: number) => gongDist(headPoint(a));

describe('FS01 registry', () => {
  it('loads and validates', () => {
    expect(Object.keys(calibers)).toContain('cw-fs01');
  });
});

describe('FS01 going train (SW200-1)', () => {
  it('center wheel turns once per hour, fourth wheel once per minute', () => {
    expect(turns('center-wheel', 3600)).toBeCloseTo(1, 9);
    expect(turns('fourth-wheel', 60)).toBeCloseTo(1, 9);
  });
  it('escape wheel rate matches 28,800 vph', () => {
    expect(turns('escape-wheel', 3600) * toothCount(part('escape-wheel').shape)! * 2).toBeCloseTo(c.specs.vph, 6);
  });
  it('meshing parts sit exactly one center distance apart', () => {
    for (const cp of c.couplings) {
      if (cp.type !== 'mesh') continue;
      const a = part(cp.a);
      const b = part(cp.b);
      if (!('module' in a.shape) || !('module' in b.shape)) throw new Error('mesh parts need a module');
      expect(a.shape.module, `${cp.a}–${cp.b}`).toBeCloseTo(b.shape.module);
      expect(Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y), `${cp.a}–${cp.b}`).toBeCloseTo(centerDistance(a.shape.module, toothCount(a.shape)!, toothCount(b.shape)!), 9);
    }
  });
  it('keeps base parts inside the SW200-1 and module parts inside the module', () => {
    for (const p of c.parts) {
      const limit = p.mechanism === 'strike' || p.id.startsWith('sub-') ? c.exterior.moduleDiameterMm! / 2 : c.specs.diameterMm / 2;
      expect(Math.hypot(p.pos.x, p.pos.y), p.id).toBeLessThan(limit);
    }
  });
  it('keeps the gong within the module\'s 35 mm, which the case must clear (photo:front)', () => {
    const g = part('gong');
    if (g.shape.kind !== 'gong') throw new Error('gong');
    expect(c.exterior.moduleDiameterMm).toBe(35);
    expect(Math.hypot(g.pos.x, g.pos.y) + g.shape.outer + g.shape.width / 2).toBeLessThan(c.exterior.moduleDiameterMm! / 2);
  });
  it('points the stem at the crown, 25.3° above 3 o\'clock', () => {
    const stem = part('stem');
    expect(stem.yaw).toBeCloseTo((-25.3 * Math.PI) / 180, 9);
    expect(Math.atan2(stem.pos.y, stem.pos.x)).toBeCloseTo(stem.yaw!, 9);
  });
});

describe('FS01 time display at 12 o\'clock', () => {
  it('turns the minute hand once per hour, clockwise', () => {
    expect(angle('minute-hand', 3600) - angle('minute-hand', 0)).toBeCloseTo(TAU, 9);
  });
  it('turns the hour hand once per 12 hours', () => {
    expect(turns('hour-hand', 43200)).toBeCloseTo(1, 9);
  });
  it('shows 10:08 at 10:08:00', () => {
    const t = HOUR + 8 * 60;
    expect(((angle('minute-hand', t) - angle('minute-hand', 0)) / TAU) % 1).toBeCloseTo(8 / 60, 6);
    expect((angle('hour-hand', t) - angle('hour-hand', 0)) / TAU).toBeCloseTo((10 + 8 / 60) / 12, 6);
  });
  it('carries both hands on the sub-dial arbor, 9.15 mm above the centre (photo:front)', () => {
    for (const id of ['minute-hand', 'hour-hand']) {
      expect(part(id).pos.x, id).toBeCloseTo(0, 9);
      expect(part(id).pos.y, id).toBeCloseTo(-9.15, 9);
    }
  });
  it('turns the snail with the minute hand', () => {
    expect(angle('snail', HOUR + 1234)).toBeCloseTo(angle('minute-hand', HOUR + 1234), 9);
  });
});

describe('FS01 strike', () => {
  it('strikes the gong just after the hour', () => {
    expect(angle('hammer', HOUR + 0.15 * 36)).toBeCloseTo(strike.swing, 4);
  });
  it('lifts the lever steadily through the hour and drops it on the hour', () => {
    let prev = angle('strike-lever', HOUR + 1);
    for (let s = 60; s < 3600; s += 60) {
      const a = angle('strike-lever', HOUR + s);
      expect(a).toBeGreaterThan(prev);
      prev = a;
    }
    expect(angle('strike-lever', HOUR + 3600 + 0.5)).toBeLessThan(0.01);
  });
  it('never reaches the gong while silent', () => {
    for (let s = 0; s < 36; s += 0.25) expect(toward(angle('hammer', HOUR + s, { chime: 1 }))).toBeLessThan(reach - 0.1);
  });
  it('strikes when the hands are set forward across the hour', () => {
    // 10:59:00, crown at 2; setRot turns the minute arbor by setRot × 14 / 12.
    const t = HOUR + 59 * 60;
    let best = -Infinity;
    for (let r = 0; r < ((TAU / 60) * 3 * 12) / 14; r += 0.0005) best = Math.max(best, toward(angle('hammer', t, { crownPos: 2, setRot: r })));
    expect(best).toBeGreaterThan(reach * 0.99);
  });
  it('stays in range when the hands are set backwards across the hour', () => {
    const t = HOUR + 60;
    for (let r = 0; r > (-(TAU / 60) * 3 * 12) / 14; r -= 0.0005) {
      const a = angle('hammer', t, { crownPos: 2, setRot: r });
      expect(Number.isFinite(a)).toBe(true);
      expect(toward(a)).toBeLessThanOrEqual(reach + 1e-9);
    }
  });
  it('steps the column wheel a tooth a press and swings the indicator to silent', () => {
    expect(angle('column-wheel', HOUR, { chime: 1 }) - angle('column-wheel', HOUR)).toBeCloseTo(TAU / 6, 9);
    expect(angle('indicator', HOUR, { chime: 1 }) - angle('indicator', HOUR)).toBeCloseTo(strike.silence.turn, 9);
  });
  it('keeps the gong clear of the hammer head at rest', () => {
    const g = part('gong');
    if (g.shape.kind !== 'gong') throw new Error('gong');
    expect(g.shape.outer - g.shape.inner).toBeGreaterThan(g.shape.width);
    expect(headReach(0)).toBeLessThan(g.shape.inner - g.shape.width / 2 - 0.15);
  });
  it('lands the hammer head on the gong\'s inner arc at the strike, and draws it well clear when silenced', () => {
    const g = part('gong');
    if (g.shape.kind !== 'gong') throw new Error('gong');
    expect(headReach(strike.swing)).toBeCloseTo(g.shape.inner - g.shape.width / 2, 2);
    let silent = -Infinity;
    for (let s = 0; s < 36; s += 0.25) silent = Math.max(silent, headReach(angle('hammer', HOUR + s, { chime: 1 })));
    expect(silent).toBeLessThan(g.shape.inner - g.shape.width / 2 - 1);
  });
  it('strikes the gong where it runs, between the hairpin and the free end', () => {
    const g = part('gong');
    const h = part('hammer');
    if (g.shape.kind !== 'gong' || h.shape.kind !== 'lever') throw new Error('shapes');
    const tip = headPoint(strike.swing);
    const a = Math.atan2(tip.y - g.pos.y, tip.x - g.pos.x);
    const wrapped = a < g.shape.from ? a + TAU : a;
    expect(wrapped).toBeGreaterThan(g.shape.from);
    expect(wrapped).toBeLessThan(g.shape.to);
  });
  it('reads the snail through the strike lever\'s tip, dropping off its step on the hour', () => {
    const sn = part('snail');
    if (sn.shape.kind !== 'snail') throw new Error('snail');
    const lever = part('strike-lever');
    if (lever.shape.kind !== 'lever') throw new Error('lever');
    // The lever's tip: its outline point nearest the snail.
    const tip = lever.shape.outline.map((p) => ({ x: p.x + lever.pos.x, y: p.y + lever.pos.y })).reduce((a, b) => (Math.hypot(a.x, a.y) < Math.hypot(b.x, b.y) ? a : b));
    expect(Math.hypot(tip.x - sn.pos.x, tip.y - sn.pos.y)).toBeCloseTo(sn.shape.rMax, 1);
    // The step (the snail's local +X) faces the tip on the hour.
    expect(Math.atan2(tip.y - sn.pos.y, tip.x - sn.pos.x)).toBeCloseTo(sn.rest ?? 0, 1);
    // Over the hour the lever follows the rim's fall from rMax to rMin.
    const len = Math.hypot(tip.x - lever.pos.x, tip.y - lever.pos.y);
    expect(strike.lift * len).toBeCloseTo(sn.shape.rMax - sn.shape.rMin, 1);
  });
});

describe('FS01 solver smoke', () => {
  it('poses every part with finite values', () => {
    for (const [id, tr] of solve({ t: HOUR + 17, explode: 0.5, chime: 0.5 })) {
      expect(Number.isFinite(tr.angle), id).toBe(true);
      expect(Number.isFinite(tr.dz), id).toBe(true);
    }
  });
});
