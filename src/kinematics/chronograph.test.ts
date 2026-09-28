import { describe, expect, it } from 'vitest';
import { CaliberSchema, type Caliber } from '../model/schema';
import { validateCaliber } from '../model/validate';
import { miniCaliber } from '../test/fixtures';
import { CHRONO_REST, counterSteps, heartAngle, nextMode, trackChrono, type ChronoMode, type ChronoTrack } from './chronograph';
import { buildSolver } from './solver';

const TAU = Math.PI * 2;
const est = { confidence: 'estimated' as const, sourceIds: [] };
const base = { side: 'back' as const, explode: { dz: 0 }, material: 'steel' as const, provenance: est, mechanism: 'chronograph' as const };

// The fixture's 120-tooth wheel `w1` (arbor a) stands in for the fourth wheel. A 12-leaf oscillating pinion meshes it
// and, when in, a 120-tooth runner, so the runner turns with w1. A 10-leaf pinion on w1's arbor drives a 40-tooth
// hour counter through the friction clutch; the runner's finger steps a 30-tooth minute counter.
export function chronoCaliber(): Caliber {
  const c = miniCaliber();
  c.parts.push(
    { ...base, id: 'osc-low', arbor: 'osc', pos: { x: 0, y: 6.6, z: 1 }, shape: { kind: 'pinion', leaves: 12, module: 0.1, length: 0.3 } },
    { ...base, id: 'osc-up', arbor: 'osc', pos: { x: 0, y: 6.6, z: 2 }, shape: { kind: 'pinion', leaves: 12, module: 0.1, length: 0.3 } },
    { ...base, id: 'runner', arbor: 'runner', pos: { x: 0, y: 13.2, z: 2 }, shape: { kind: 'wheel', teeth: 120, module: 0.1, thickness: 0.2, spokes: 0 } },
    { ...base, id: 'runner-heart', arbor: 'runner', pos: { x: 0, y: 13.2, z: 2.3 }, shape: { kind: 'heart', radius: 1, thickness: 0.2 } },
    { ...base, id: 'minutes', arbor: 'minutes', pos: { x: 6, y: 13.2, z: 2 }, shape: { kind: 'wheel', teeth: 30, module: 0.1, thickness: 0.2, spokes: 0 } },
    { ...base, id: 'minutes-heart', arbor: 'minutes', pos: { x: 6, y: 13.2, z: 2.3 }, shape: { kind: 'heart', radius: 0.8, thickness: 0.2 } },
    { ...base, id: 'hour-driver', arbor: 'a', pos: { x: 0, y: 0, z: 0 }, shape: { kind: 'pinion', leaves: 10, module: 0.1, length: 0.3 } },
    { ...base, id: 'hours', arbor: 'hours', pos: { x: 2.5, y: 0, z: 0 }, shape: { kind: 'wheel', teeth: 40, module: 0.1, thickness: 0.2, spokes: 0 } },
    { ...base, id: 'hours-heart', arbor: 'hours', pos: { x: 2.5, y: 0, z: 0.3 }, shape: { kind: 'heart', radius: 0.8, thickness: 0.2 } },
    { ...base, id: 'cam', pos: { x: -5, y: 8, z: 2 }, shape: { kind: 'cam', teeth: 8, radius: 1.2, thickness: 0.2 } },
    { ...base, id: 'hammer', rest: Math.PI / 2, pos: { x: 3, y: 8, z: 2.6 }, shape: { kind: 'lever', outline: [{ x: -0.5, y: -0.5 }, { x: 4, y: -0.5 }, { x: 4, y: 0.5 }, { x: -0.5, y: 0.5 }], thickness: 0.2, hole: 0.2 } },
  );
  c.couplings.push(
    { type: 'mesh', a: 'w1', b: 'osc-low' },
    { type: 'chronograph', cam: 'cam', pinion: 'osc-up', runner: 'runner', swing: 0.2, minutes: { wheel: 'minutes' }, hours: { driver: 'hour-driver', wheel: 'hours' }, hearts: ['runner-heart', 'minutes-heart', 'hours-heart'], hammers: ['hammer'], stroke: 0.3 },
  );
  return c;
}

// Runs the chronograph through `seconds` of movement time in frames of `dt`, as Movement does.
function run(c: Caliber, track: ChronoTrack, state: { mode: ChronoMode; presses: number }, from: number, seconds: number, dt = 1 / 60) {
  const solve = buildSolver(c);
  const info = solve.info.chrono!;
  let t = track;
  for (let s = 0; s <= seconds + 1e-9; s += dt) {
    const tr = solve({ t: from + s, explode: 0, chrono: t });
    const byArbor = (key: string) => [...tr.entries()].find(([id]) => c.parts.find((p) => p.id === id && (p.arbor ?? p.id) === key))![1].angle;
    t = trackChrono(t, state, info.ratios, { pinion: byArbor(info.pinionKey), driver: info.driverKey ? byArbor(info.driverKey) : 0 }, dt);
  }
  return { track: t, pose: solve({ t: from + seconds, explode: 0, chrono: t }) };
}

describe('chronograph state', () => {
  it('starts and stops on the start/stop pusher and resets only when stopped', () => {
    expect(nextMode('reset', 'start-stop')).toBe('running');
    expect(nextMode('running', 'start-stop')).toBe('stopped');
    expect(nextMode('stopped', 'start-stop')).toBe('running');
    expect(nextMode('stopped', 'reset')).toBe('reset');
    expect(nextMode('running', 'reset')).toBe('running');
    expect(nextMode('reset', 'reset')).toBe('reset');
  });
  it('carries the pinion\'s motion to the runner only while running', () => {
    const ratios = { runner: 2, hours: 0.5 };
    const a = trackChrono(CHRONO_REST, { mode: 'running', presses: 1 }, ratios, { pinion: 1, driver: 1 }, 0.01);
    const b = trackChrono(a, { mode: 'running', presses: 1 }, ratios, { pinion: 1.5, driver: 3 }, 0.01);
    expect(b.runner).toBeCloseTo(1);
    expect(b.hours).toBeCloseTo(1);
    const c = trackChrono(b, { mode: 'stopped', presses: 2 }, ratios, { pinion: 4, driver: 9 }, 0.01);
    expect(c.runner).toBe(b.runner);
    expect(c.hours).toBe(b.hours);
  });
  it('swings the pinion in and out and steps the cam by easing, not jumping', () => {
    let t = trackChrono(CHRONO_REST, { mode: 'running', presses: 1 }, { runner: 1, hours: 1 }, { pinion: 0, driver: 0 }, 0.02);
    expect(t.engage).toBeGreaterThan(0);
    expect(t.engage).toBeLessThan(1);
    expect(t.cam).toBeGreaterThan(0);
    expect(t.hammer).toBeLessThan(1);
    for (let i = 0; i < 20; i++) t = trackChrono(t, { mode: 'running', presses: 1 }, { runner: 1, hours: 1 }, { pinion: 0, driver: 0 }, 0.02);
    expect(t).toMatchObject({ engage: 1, cam: 1, hammer: 0 });
  });
  it('drops the hammer, then turns everything home and starts from zero', () => {
    let t: ChronoTrack = { ...CHRONO_REST, runner: 7.5 * TAU, hours: 1, hammer: 0 };
    t = trackChrono(t, { mode: 'reset', presses: 2 }, { runner: 1, hours: 1 }, { pinion: 0, driver: 0 }, 0.05);
    expect(t.zero).toBe(0);
    let steps = 0;
    while (t.runner !== 0 && steps++ < 100) t = trackChrono(t, { mode: 'reset', presses: 2 }, { runner: 1, hours: 1 }, { pinion: 0, driver: 0 }, 0.05);
    expect(t).toMatchObject({ runner: 0, hours: 0, zero: 0, hammer: 1 });
    expect(steps).toBeLessThan(12);
  });
  it('lets a start pressed while the hearts are turning wait for them, then runs from zero', () => {
    const ratios = { runner: 1, hours: 1 };
    let t: ChronoTrack = { ...CHRONO_REST, runner: 7.3 * TAU, hours: 1, hammer: 0 };
    let pinion = 0;
    const step = (mode: ChronoMode) => {
      pinion += 0.05;
      t = trackChrono(t, { mode, presses: 3 }, ratios, { pinion, driver: pinion }, 0.05);
    };
    // Reset until the hearts are partway round.
    while (t.zero === 0 || t.zero < 0.3) step('reset');
    const partway = t.runner;
    step('running');
    // Still going home, not snapping back to the old reading nor running on from it.
    expect(t.runner).toBe(partway);
    expect(t.zero).toBeGreaterThan(0.3);
    let n = 0;
    while (t.runner !== 0 && n++ < 40) step('running');
    expect(t).toMatchObject({ runner: 0, hours: 0, zero: 0 });
    step('running');
    step('running');
    expect(t.runner).toBeGreaterThan(0);
    expect(t.runner).toBeLessThan(0.2);
  });
  it('turns a heart home the shorter way', () => {
    expect(heartAngle(TAU * 3 + 0.4, 0.5)).toBeCloseTo(0.2);
    expect(heartAngle(TAU * 3 - 0.4, 0.5)).toBeCloseTo(-0.2);
    expect(heartAngle(TAU * 3 + 0.4, 0)).toBeCloseTo(TAU * 3 + 0.4);
    expect(heartAngle(5, 1)).toBeCloseTo(0);
  });
  it('steps the minute counter once per runner turn, near the end of the turn', () => {
    expect(counterSteps(0.5 * TAU)).toBe(0);
    expect(counterSteps(0.99 * TAU)).toBeGreaterThan(0);
    expect(counterSteps(1.01 * TAU)).toBe(1);
    expect(counterSteps(29.5 * TAU)).toBe(29);
  });
});

describe('chronograph coupling', () => {
  const c = chronoCaliber();

  it('validates, and rejects a heart the hammer cannot reach', () => {
    expect(() => CaliberSchema.parse(c)).not.toThrow();
    expect(validateCaliber(c)).toEqual([]);
    const bad = chronoCaliber();
    bad.parts.find((p) => p.id === 'hours-heart')!.arbor = 'a';
    bad.parts.find((p) => p.id === 'cam')!.shape = { kind: 'wheel', teeth: 8, module: 0.1, thickness: 0.2, spokes: 0 };
    expect(validateCaliber(bad)).toEqual(expect.arrayContaining(['chronograph: heart hours-heart is not on the runner or a counter', 'chronograph: cam is not a cam']));
  });
  it('turns the runner with the wheel it takes its drive from, the same way, only while running', () => {
    const solve = buildSolver(c);
    expect(solve.info.chrono).toMatchObject({ pinionKey: 'osc', driverKey: 'a' });
    const w1 = (t: number) => solve({ t, explode: 0 }).get('w1')!.angle;
    const { track } = run(c, { ...CHRONO_REST, hammer: 0 }, { mode: 'running', presses: 1 }, 100, 10);
    expect(track.runner).toBeCloseTo(w1(110) - w1(100), 2);
    const { track: stopped } = run(c, track, { mode: 'stopped', presses: 2 }, 110, 5);
    expect(stopped.runner).toBe(track.runner);
  });
  it('steps the minute counter a tooth per runner turn and turns the hour counter at its gear ratio', () => {
    const solve = buildSolver(c);
    const pose = { runner: 3.2 * TAU, hours: 1.3, engage: 1, cam: 1, hammer: 0, zero: 0 };
    const tr = solve({ t: 0, explode: 0, chrono: pose });
    expect(tr.get('runner')!.angle).toBeCloseTo(3.2 * TAU);
    expect(tr.get('runner-heart')!.angle).toBeCloseTo(3.2 * TAU);
    expect(tr.get('minutes')!.angle).toBeCloseTo((3 * TAU) / 30);
    expect(tr.get('hours')!.angle).toBeCloseTo(1.3);
    expect(solve.info.chrono!.ratios.hours).toBeCloseTo(-10 / 40);
    expect(tr.get('cam')!.angle).toBeCloseTo(TAU / 8);
  });
  it('swings the pinion out of mesh when disengaged and drops the hammer along its own axis', () => {
    const solve = buildSolver(c);
    const inMesh = solve({ t: 0, explode: 0, chrono: { runner: 0, hours: 0, engage: 1, cam: 0, hammer: 0, zero: 0 } });
    expect(inMesh.get('osc-up')).toMatchObject({ dx: 0, dy: 0 });
    expect(inMesh.get('hammer')).toMatchObject({ dx: 0, dy: 0 });
    const out = solve({ t: 0, explode: 0, chrono: { runner: 0, hours: 0, engage: 0, cam: 0, hammer: 1, zero: 0 } });
    // The runner sits at +Y of the pinion, so out of mesh the pinion moves toward −Y; the lower pinion stays put.
    expect(out.get('osc-up')!.dy).toBeCloseTo(-0.2);
    expect(out.get('osc-low')).toMatchObject({ dx: 0, dy: 0 });
    expect(out.get('hammer')!.dx).toBeCloseTo(0);
    expect(out.get('hammer')!.dy).toBeCloseTo(0.3);
  });
  it('leaves calibers without a chronograph untouched', () => {
    const plain = buildSolver(miniCaliber());
    expect(plain.info.chrono).toBeNull();
    const a = plain({ t: 12.3, explode: 0 });
    const b = plain({ t: 12.3, explode: 0, chrono: { runner: 5, hours: 5, engage: 1, cam: 3, hammer: 1, zero: 0.5 } });
    expect([...b.entries()]).toEqual([...a.entries()]);
  });
});

describe('click winding', () => {
  it('winds one way only', () => {
    const c = miniCaliber();
    const b = { ...base, mechanism: 'automatic' as const };
    c.parts.push(
      { ...b, id: 'rotor', arbor: 'rotor', pos: { x: 0, y: 0, z: 4 }, shape: { kind: 'rotor', radius: 12, hub: 1.2, thickness: 0.4 } },
      { ...b, id: 'rotor-pinion', arbor: 'rotor', pos: { x: 0, y: 0, z: 3.6 }, shape: { kind: 'pinion', leaves: 10, module: 0.1, length: 0.3 } },
      { ...b, id: 'rev', pos: { x: 2.5, y: 0, z: 3.6 }, shape: { kind: 'wheel', teeth: 40, module: 0.1, thickness: 0.15, spokes: 0 } },
      { ...b, id: 'rev-pinion', pos: { x: 2.5, y: 0, z: 3.3 }, shape: { kind: 'pinion', leaves: 8, module: 0.1, length: 0.3 } },
    );
    c.couplings.push({ type: 'mesh', a: 'rotor-pinion', b: 'rev' }, { type: 'click', input: 'rev', output: 'rev-pinion', direction: 1 });
    expect(validateCaliber(c)).toEqual([]);
    const w = buildSolver(c).info.winder!;
    expect(w).toMatchObject({ inputKey: 'rev', outputKey: 'rev-pinion' });
    expect(w.advance(0, 0.5)).toBeCloseTo(0.5);
    expect(w.advance(0.5, 0)).toBe(0);
  });
});
