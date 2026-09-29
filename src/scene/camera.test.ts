import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { focusCenterLocal, MOVEMENT_ROTATION, toWorld } from './focus';
import { INTRO_POSITION, OVERVIEW_OFFSET, shotFor } from './shots';
import { easeInOutCubic, Tween } from './tween';
import { miniCaliber } from '../test/fixtures';

const c = miniCaliber();

describe('focus', () => {
  it('averages the positions of a focus group', () => {
    const [x, y, z] = focusCenterLocal(c, 'esc');
    expect(x).toBeCloseTo(6.5);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(1.3);
  });
  it('matches the movement rotation', () => {
    const v = new THREE.Vector3(1, 2, 3).applyAxisAngle(new THREE.Vector3(1, 0, 0), MOVEMENT_ROTATION);
    const w = toWorld([1, 2, 3], 'back');
    expect(v.x).toBeCloseTo(w[0]);
    expect(v.y).toBeCloseTo(w[1]);
    expect(v.z).toBeCloseTo(w[2]);
  });
});

describe('shotFor', () => {
  it('frames the overview in free mode', () => {
    const s = shotFor(c, 'free', 2);
    expect(s.target).toEqual([0, 0, 0]);
    expect(s.position).toEqual(OVERVIEW_OFFSET);
  });
  it('frames the focus group with the step offset in the tour', () => {
    const s = shotFor(c, 'tour', 2);
    const center = toWorld(focusCenterLocal(c, 'esc'), 'back');
    expect(s.target).toEqual(center);
    expect(s.position).toEqual([center[0] - 7, center[1] + 12, center[2] + 14]);
  });
  it('holds still in the intro and delays the opening flight', () => {
    expect(shotFor(c, 'intro', 0)).toMatchObject({ position: INTRO_POSITION, duration: 0 });
    expect(shotFor(c, 'opening', 0).delay).toBeGreaterThan(1);
  });
});

describe('Tween', () => {
  it('eases and lands exactly on the shot', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    const tw = new Tween([0, 0, 0], [0, 0, 0], { target: [1, 1, 1], position: [10, 0, 0], flip: 0, duration: 1, delay: 0 });
    tw.step(0.5);
    const end = tw.step(0.6);
    expect(end.done).toBe(true);
    expect(end.position).toEqual([10, 0, 0]);
    expect(end.target).toEqual([1, 1, 1]);
  });
  it('waits for the delay before moving', () => {
    const tw = new Tween([0, 0, 0], [0, 0, 0], { target: [0, 0, 0], position: [10, 0, 0], flip: 0, duration: 1, delay: 1 });
    expect(tw.step(0.5).position).toEqual([0, 0, 0]);
  });
});

describe('toWorld per side', () => {
  it('mirrors z and y on the dial side', () => {
    expect(toWorld([1, 2, 3], 'dial')).toEqual([1, -3, 2]);
    expect(toWorld([1, 2, 3], 'back')).toEqual([1, 3, -2]);
  });
});

describe('flip', () => {
  it('tween interpolates and lands on the flip', () => {
    const tw = new Tween([0, 0, 0], [0, 0, 0], { target: [0, 0, 0], position: [1, 0, 0], flip: Math.PI, duration: 1, delay: 0 }, 0);
    const mid = tw.step(0.5);
    expect(mid.flip).toBeGreaterThan(0);
    expect(mid.flip).toBeLessThan(Math.PI);
    expect(tw.step(1).flip).toBe(Math.PI);
  });
  it('free mode shots follow the free side', () => {
    expect(shotFor(c, 'free', 0, 'dial').flip).toBe(Math.PI);
    expect(shotFor(c, 'free', 0, 'back').flip).toBe(0);
  });
});
