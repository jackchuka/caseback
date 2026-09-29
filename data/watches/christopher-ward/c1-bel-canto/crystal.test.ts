import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import { buildShape } from '../../../../src/geometry/parts';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { bezelTop, caseFront } from './case';
import { belCantoCrystal, crystalApex } from './crystal';
import { belCantoCaseback } from './caseback';
import { zRange } from '../../../../src/test/geometry';
import { P } from './params';

const caliber = calibers['cw-fs01']!;
const m = movementFrame(caliber);
// The frontmost point the dial-side movement reaches: the floating sub-dial's wheels and arbors.
const movementFront = Math.min(
  ...caliber.parts.filter((p) => p.side === 'dial').flatMap((p) => buildShape(p.shape, p.material).map((l) => { l.geometry.computeBoundingBox(); return l.geometry.boundingBox!.min.z + p.pos.z; })),
);

describe('Bel Canto crystal', () => {
  const layers = belCantoCrystal(m);
  const g = layers[0]!.geometry;
  g.computeBoundingBox();
  const b = g.boundingBox!;
  it('is the build\'s own crystal material', () => {
    expect(layers.map((l) => l.material)).toEqual(['crystal']);
  });
  it('domes by its height from a rim just proud of the bezel, 13 mm in front of the caseback', () => {
    expect(b.min.z).toBeCloseTo(crystalApex(m), 5);
    expect(zRange(belCantoCaseback(m))[1] - crystalApex(m)).toBeCloseTo(P.totalThickness, 5);
    expect(bezelTop(m) - (crystalApex(m) + P.domeHeight)).toBeCloseTo(P.bezelProud, 5);
  });
  it('sits inside the bezel ring on the case front', () => {
    expect(b.max.x).toBeLessThan(P.bezelInner);
    expect(b.max.z).toBeCloseTo(caseFront(m), 5);
  });
  it('clears the floating sub-dial and stays in front of the hour hand\'s seat', () => {
    const p = g.getAttribute('position');
    // Over the opening in the case, where the movement lies.
    for (let i = 0; i < p.count; i++) if (Math.hypot(p.getX(i), p.getY(i)) < P.bore) expect(p.getZ(i)).toBeLessThan(movementFront - 0.3);
    const hour = caliber.parts.find((x) => x.id === 'hour-hand')!;
    expect(b.max.z).toBeLessThan(hour.pos.z);
  });
});
