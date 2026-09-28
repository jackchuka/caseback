import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { bezelTop, presageBezel } from './bezel';
import { crystalTop } from './case';
import { presageCrystal } from './crystal';
import { P } from './params';

const m = movementFrame(calibers['seiko-nh35a']!);
const box = (ls: { geometry: THREE.BufferGeometry }[]) => {
  const b = new THREE.Box3();
  for (const l of ls) { l.geometry.computeBoundingBox(); b.union(l.geometry.boundingBox!); }
  return b;
};

describe('Presage SRPB43 box crystal and bezel', () => {
  const c = box(presageCrystal(m));
  it('stands a tall box crystal out of the bezel up to the apex', () => {
    expect(c.min.z).toBeCloseTo(crystalTop(m), 5);
    expect(bezelTop(m) - c.min.z).toBeGreaterThan(2);
    expect(c.max.x).toBeCloseTo(P.crystalRadius, 2);
  });
  it('sits the crystal wall on the bezel and the bezel inside the case', () => {
    const b = box(presageBezel(m).filter((l) => l.name !== 'flange'));
    expect(b.max.x).toBeCloseTo(P.bezelOuter, 2);
    expect(b.min.z).toBeCloseTo(bezelTop(m), 5);
    expect(P.crystalRadius).toBeLessThan(P.bezelInner);
  });
  it('closes the well between the dial edge and the crystal with a flange', () => {
    const f = box(presageBezel(m).filter((l) => l.name === 'flange'));
    expect(f.max.x).toBeCloseTo(P.crystalRadius, 2);
    expect(f.max.z).toBeCloseTo(m.dialZ - 0.21, 2);
  });
});
