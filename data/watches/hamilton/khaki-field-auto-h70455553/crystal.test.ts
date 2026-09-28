import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { bezelTop } from './bezel';
import { crystalRim, hamiltonCrystal } from './crystal';
import { H } from './params';

const m = movementFrame(calibers['eta-2824-2']!);

describe('Khaki Field crystal', () => {
  const g = hamiltonCrystal(m)[0]!.geometry;
  g.computeBoundingBox();
  const b = g.boundingBox!;
  it('sits inside the bezel lip', () => {
    expect(b.max.x).toBeLessThan(H.bezelInner);
  });
  it('stands just proud of the lip and domes by its rise', () => {
    expect(crystalRim(m)).toBeLessThan(bezelTop(m));
    expect(b.min.z).toBeCloseTo(crystalRim(m) - H.crystalDome, 2);
  });
  it('clears the seconds hand', () => {
    expect(b.max.z).toBeLessThan(m.secondsZ - 0.3);
  });
});
