import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { layersBox } from '../../../../src/test/geometry';
import { bezelTop, presageBezel } from './bezel';
import { crystalTop } from './case';
import { presageCrystal } from './crystal';
import { P } from './params';

const m = movementFrame(calibers['seiko-nh35a']!);

describe('Presage SRPB43 box crystal and bezel', () => {
  const c = layersBox(presageCrystal(m));
  it('stands a tall box crystal out of the bezel up to the apex', () => {
    expect(c.min.z).toBeCloseTo(crystalTop(m), 5);
    expect(bezelTop(m) - c.min.z).toBeGreaterThan(2);
    expect(c.max.x).toBeCloseTo(P.crystalRadius, 2);
  });
  it('sits the crystal wall on the bezel and the bezel inside the case', () => {
    const b = layersBox(presageBezel(m).filter((l) => l.name !== 'flange'));
    expect(b.max.x).toBeCloseTo(P.bezelOuter, 2);
    expect(b.min.z).toBeCloseTo(bezelTop(m), 5);
    expect(P.crystalRadius).toBeLessThan(P.bezelInner);
  });
  it('closes the well between the dial edge and the crystal with a flange', () => {
    const f = layersBox(presageBezel(m).filter((l) => l.name === 'flange'));
    expect(f.max.x).toBeCloseTo(P.crystalRadius, 2);
    expect(f.max.z).toBeCloseTo(m.dialZ - 0.21, 2);
  });
});
