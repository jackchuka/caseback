import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { crownEuler } from './crown';

describe('crownEuler', () => {
  it('spins the crown about its own axis, which stays along X', () => {
    for (const theta of [0, 0.5, 1.5, 3]) {
      const axis = new THREE.Vector3(0, 1, 0).applyEuler(crownEuler(theta));
      expect(Math.abs(axis.x)).toBeCloseTo(1, 6);
    }
  });
});
