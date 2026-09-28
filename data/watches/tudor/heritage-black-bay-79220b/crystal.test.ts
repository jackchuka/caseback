import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { bezelTop, tudorBezel } from './bezel';
import { tudorCrystal } from './crystal';
import { T } from './params';

const m = movementFrame(calibers['eta-2824-2']!);

describe('Tudor 79220B crystal', () => {
  const g = tudorCrystal(m)[0]!.geometry;
  g.computeBoundingBox();
  const b = g.boundingBox!;
  it('sits inside the bezel lip', () => {
    expect(b.max.x).toBeLessThanOrEqual(T.bezelInner);
  });
  it('rises above the bezel by its wall and dome', () => {
    expect(b.min.z).toBeCloseTo(bezelTop(m) - T.crystalWall - T.crystalDome, 2);
    void THREE;
  });
  it('stands in front of the sloping insert', () => {
    const insert = tudorBezel(m).find((l) => l.material === 'insert')!.geometry;
    insert.computeBoundingBox();
    expect(b.min.z).toBeLessThan(insert.boundingBox!.min.z);
  });
});
