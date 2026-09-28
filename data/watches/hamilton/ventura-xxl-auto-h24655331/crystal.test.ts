import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { caseFront, crystalFront } from './case';
import { venturaCrystal } from './crystal';
import { outlines } from './plan';

const m = movementFrame(calibers['eta-2824-2']!);

describe('Ventura crystal', () => {
  const g = venturaCrystal()[0]!.geometry;
  g.computeBoundingBox();
  const b = g.boundingBox!;
  it('is cut to the dial opening', () => {
    const xs = outlines.dial.map(([x]) => x), ys = outlines.dial.map(([, y]) => y);
    expect(b.min.x).toBeCloseTo(Math.min(...xs), 3);
    expect(b.max.y).toBeCloseTo(Math.max(...ys), 3);
  });
  it('sits flat, just under the case front', () => {
    expect(b.min.z).toBeCloseTo(crystalFront(), 5);
    expect(b.min.z).toBeGreaterThan(caseFront());
  });
  it('clears the seconds hand', () => {
    expect(b.max.z).toBeLessThan(m.secondsZ - 0.2);
  });
});
