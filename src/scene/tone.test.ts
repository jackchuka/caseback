import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { LOOKS } from './looks';
import { neutral, neutralInverse } from './tone';

describe('neutral tone curve', () => {
  it('leaves mid-tones nearly as authored', () => {
    const [r] = neutral([0.5, 0.5, 0.5]);
    expect(r).toBeCloseTo(0.46, 2);
  });
  it('inverts, so a tone-mapped background still shows the theme colour', () => {
    for (const look of Object.values(LOOKS)) {
      const c = new THREE.Color(look.background);
      const target: [number, number, number] = [c.r, c.g, c.b];
      const back = neutral(neutralInverse(target, look.exposure), look.exposure);
      for (let i = 0; i < 3; i++) expect(back[i]).toBeCloseTo(target[i]!, 3);
    }
  });
});
