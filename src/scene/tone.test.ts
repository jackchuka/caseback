import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { LOOKS } from './looks';
import { aces, neutral, toneInverse } from './tone';

describe('neutral tone curve', () => {
  it('leaves mid-tones nearly as authored', () => {
    const [r] = neutral([0.5, 0.5, 0.5]);
    expect(r).toBeCloseTo(0.46, 2);
  });
});

describe('ACES filmic tone curve (three.js variant)', () => {
  it('maps black to black and saturates bright white', () => {
    for (const v of aces([0, 0, 0])) expect(Math.abs(v)).toBeLessThan(0.01);
    for (const v of aces([20, 20, 20])) expect(v).toBeCloseTo(1, 2);
  });
  it('rises monotonically through the mid-tones', () => {
    let prev = -1;
    for (let x = 0.01; x < 2; x += 0.05) {
      const [r] = aces([x, x, x]);
      expect(r).toBeGreaterThan(prev);
      prev = r;
    }
  });
});

describe('theme backgrounds', () => {
  it('invert through their own curve, so a tone-mapped background still shows the theme colour', () => {
    for (const look of Object.values(LOOKS)) {
      const c = new THREE.Color(look.background);
      const target: [number, number, number] = [c.r, c.g, c.b];
      const forward = look.tone === 'aces' ? aces : neutral;
      const back = forward(toneInverse(look.tone, target, look.exposure), look.exposure);
      for (let i = 0; i < 3; i++) expect(back[i]).toBeCloseTo(target[i]!, 3);
    }
  });
});
