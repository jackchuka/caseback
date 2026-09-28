import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { caseFront, caseShape } from './case';
import { CROWN_FLUTES, crownX, hamiltonCrown } from './crown';
import { H } from './params';

const m = movementFrame(calibers['eta-2824-2']!);

describe('Khaki Field crown', () => {
  const layers = hamiltonCrown();
  const body = layers.find((l) => l.material === 'polished')!.geometry;
  it('turns a knurled crown at the published diameter', () => {
    body.computeBoundingBox();
    const b = body.boundingBox!;
    expect(b.max.y - b.min.y).toBeCloseTo(H.crownLength, 1);
    const p = body.getAttribute('position');
    const grip: number[] = [];
    for (let i = 0; i < p.count; i++) if (p.getY(i) > b.min.y + 1.2 && p.getY(i) < b.max.y - 0.4) grip.push(Math.hypot(p.getX(i), p.getZ(i)));
    expect(Math.max(...grip)).toBeCloseTo(H.crownDiameter / 2, 1);
    expect(Math.min(...grip.filter((r) => r > H.crownDiameter / 4))).toBeLessThan(H.crownDiameter / 2 - 0.2);
    expect(CROWN_FLUTES).toBe(20);
  });
  it('ends 4.1 mm past the case, as on the front photo', () => {
    expect(crownX() + H.crownLength / 2 - H.caseRadius).toBeCloseTo(4.1, 1);
  });
  it('sits on the flank, inside the case middle\'s height', () => {
    expect(m.stemZ - H.crownDiameter / 2).toBeGreaterThan(caseFront(m));
    expect(m.stemZ + H.crownDiameter / 2).toBeLessThan(caseShape(m).back);
  });
});
