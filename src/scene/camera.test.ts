import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { focusCenterLocal, MOVEMENT_ROTATION_VALUE, toWorld } from './focus';
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
    const v = new THREE.Vector3(1, 2, 3).applyAxisAngle(new THREE.Vector3(1, 0, 0), MOVEMENT_ROTATION_VALUE);
    const w = toWorld([1, 2, 3]);
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
    const center = toWorld(focusCenterLocal(c, 'esc'));
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
    const tw = new Tween([0, 0, 0], [0, 0, 0], { target: [1, 1, 1], position: [10, 0, 0], duration: 1, delay: 0 });
    tw.step(0.5);
    const end = tw.step(0.6);
    expect(end.done).toBe(true);
    expect(end.position).toEqual([10, 0, 0]);
    expect(end.target).toEqual([1, 1, 1]);
  });
  it('waits for the delay before moving', () => {
    const tw = new Tween([0, 0, 0], [0, 0, 0], { target: [0, 0, 0], position: [10, 0, 0], duration: 1, delay: 1 });
    expect(tw.step(0.5).position).toEqual([0, 0, 0]);
  });
});
