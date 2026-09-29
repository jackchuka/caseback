import { describe, expect, it } from 'vitest';
import { easePresses, hammerAngle, hourPhase, silence, STRIKE_WINDOW, strikePose } from './strike';
import { buildSolver } from './solver';
import { getCaliber } from '../../data/calibers';
import { miniCaliber } from '../test/fixtures';
import type { Caliber } from '../model/schema';

const TAU = Math.PI * 2;
const G = { lift: 0.35, swing: 0.14, turn: 0.6, retreat: 0.3, wheelTeeth: 8 };

describe('hourPhase', () => {
  it('runs 0 to 1 through each hour, backwards turns included', () => {
    expect(hourPhase(0)).toBe(0);
    expect(hourPhase(TAU * 10.25)).toBeCloseTo(0.25, 9);
    expect(hourPhase(-TAU * 0.25)).toBeCloseTo(0.75, 9);
  });
});

describe('hammerAngle', () => {
  it('reaches the gong a fraction into the strike window', () => {
    expect(hammerAngle(0.15 * STRIKE_WINDOW, 0.14)).toBeCloseTo(0.14, 9);
  });
  it('falls back to its banking by the end of the window', () => {
    expect(hammerAngle(STRIKE_WINDOW, 0.14)).toBeCloseTo(0, 9);
  });
  it('is drawn back steadily through the rest of the hour', () => {
    let prev = hammerAngle(STRIKE_WINDOW, 0.14);
    for (let p = 0.02; p < 1; p += 0.01) {
      const a = hammerAngle(p, 0.14);
      expect(a).toBeLessThan(prev);
      prev = a;
    }
  });
  it('is continuous across the hour', () => {
    expect(hammerAngle(1 - 1e-9, 0.14)).toBeCloseTo(hammerAngle(0, 0.14), 6);
  });
});

describe('silence', () => {
  it('toggles on each whole press', () => {
    expect(silence(0)).toBe(0);
    expect(silence(1)).toBe(1);
    expect(silence(2)).toBe(0);
    expect(silence(5)).toBe(1);
  });
  it('silence stays within 0..1 between presses', () => {
    for (let v = 0; v <= 6; v += 0.037) {
      expect(silence(v)).toBeGreaterThanOrEqual(0);
      expect(silence(v)).toBeLessThanOrEqual(1);
    }
  });
});

describe('strikePose', () => {
  it('lifts the lever through the hour and drops it on the hour', () => {
    expect(strikePose(TAU * 0.5, 0, G).lever).toBeCloseTo(0.35 * 0.5, 9);
    expect(strikePose(TAU * (1 - 1e-6), 0, G).lever).toBeGreaterThan(0.349);
    expect(strikePose(TAU * (1 + 1e-6), 0, G).lever).toBeLessThan(0.001);
  });
  it('keeps the hammer off the gong while silent', () => {
    for (let p = 0; p < 1; p += 0.0005) expect(strikePose(TAU * p, 1, G).hammer).toBeLessThan(G.swing - 0.1);
  });
  it('steps the column wheel a tooth a press and swings the indicator', () => {
    expect(strikePose(0, 1, G).wheel).toBeCloseTo(TAU / 8, 9);
    expect(strikePose(0, 1, G).indicator).toBeCloseTo(0.6, 9);
    expect(strikePose(0, 2, G).indicator).toBeCloseTo(0, 9);
  });
});

describe('easePresses', () => {
  it('moves toward the pushes seen without overshooting', () => {
    expect(easePresses(0, 1, 0.05)).toBeCloseTo(0.05 / 0.15, 9);
    expect(easePresses(0.9, 1, 0.05)).toBe(1);
  });
});

describe("the solver's strike", () => {
  // The mini caliber's wheel `w1` carries the snail here, so the strike follows its arbor's angle.
  const withSnail = (): Caliber => {
    const c = miniCaliber();
    const est = { confidence: 'estimated' as const, sourceIds: [] };
    const lever = (id: string) => ({ id, mechanism: 'strike' as const, side: 'dial' as const, pos: { x: 3, y: 3, z: -2 }, explode: { dz: -1 }, material: 'steel' as const, shape: { kind: 'lever' as const, outline: [{ x: 0, y: -0.3 }, { x: 2, y: 0 }, { x: 0, y: 0.3 }], thickness: 0.2, hole: 0.1 }, provenance: est });
    return {
      ...c,
      parts: [
        ...c.parts,
        { id: 'snail', arbor: 'a', mechanism: 'strike', side: 'dial', pos: { x: 0, y: 0, z: -2 }, explode: { dz: -1 }, material: 'steel', shape: { kind: 'snail', rMin: 1, rMax: 2, thickness: 0.3 }, provenance: est },
        lever('lever'), lever('hammer'), lever('switch'), lever('indicator'),
        { id: 'column', mechanism: 'strike', side: 'dial', pos: { x: 5, y: 0, z: -2 }, explode: { dz: -1 }, material: 'steel', shape: { kind: 'cam', teeth: 8, radius: 1.5, thickness: 0.3 }, provenance: est },
      ],
      couplings: [...c.couplings, { type: 'strike', snail: 'snail', lever: 'lever', hammer: 'hammer', lift: 0.35, swing: 0.14, silence: { wheel: 'column', switch: 'switch', indicator: 'indicator', turn: 0.6, retreat: 0.3 } }],
    };
  };
  it("poses every strike part from the snail arbor's angle and the presses", () => {
    const out = buildSolver(withSnail())({ t: 12.3, explode: 0, chime: 1.4 });
    const want = strikePose(out.get('w1')!.angle, 1.4, G);
    expect(out.get('lever')!.angle).toBeCloseTo(want.lever, 9);
    expect(out.get('hammer')!.angle).toBeCloseTo(want.hammer, 9);
    expect(out.get('column')!.angle).toBeCloseTo(want.wheel, 9);
    expect(out.get('switch')!.angle).toBeCloseTo(want.switch, 9);
    expect(out.get('indicator')!.angle).toBeCloseTo(want.indicator, 9);
  });
  it('ignores chime without a strike', () => {
    const solve = buildSolver(getCaliber('eta-2824-2')!);
    const a = solve({ t: 5000, explode: 0 });
    const b = solve({ t: 5000, explode: 0, chime: 3 });
    for (const [id, tr] of a) expect(b.get(id)).toEqual(tr);
  });
});
