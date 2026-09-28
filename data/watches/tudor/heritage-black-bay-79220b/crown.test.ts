import { describe, expect, it } from 'vitest';
import { crownX, tudorCrown } from './crown';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { caseFront, caseShape } from './case';
import { T } from './params';

const m = movementFrame(calibers['eta-2824-2']!);

describe('Tudor 79220B crown', () => {
  const layers = tudorCrown();
  const body = layers.find((l) => l.material === 'polished')!.geometry;
  it('turns a fluted big crown at the set size', () => {
    body.computeBoundingBox();
    const b = body.boundingBox!;
    expect(b.max.y - b.min.y).toBeCloseTo(T.crownLength, 0);
    const p = body.getAttribute('position');
    const r: number[] = [];
    for (let i = 0; i < p.count; i++) if (Math.abs(p.getY(i)) < T.crownLength / 2 - 0.5) r.push(Math.hypot(p.getX(i), p.getZ(i)));
    expect(Math.max(...r)).toBeCloseTo(T.crownDiameter / 2, 1);
    expect(Math.min(...r.filter((x) => x > T.crownDiameter / 4))).toBeLessThan(T.crownDiameter / 2 - 0.08);
  });
  it('has a tube toward the case and sits beyond it', () => {
    const tube = layers.find((l) => l.material === 'steel')!.geometry;
    tube.computeBoundingBox();
    expect(tube.boundingBox!.min.y).toBeGreaterThan(0);
    expect(crownX() - T.crownLength / 2).toBeGreaterThan(T.caseRadius);
  });
  it('sits at the measured depth on the flank, 4.4 mm behind the case front', () => {
    expect(m.stemZ - caseFront(m)).toBeCloseTo(4.4, 1);
    expect(m.stemZ - T.crownDiameter / 2).toBeGreaterThan(caseFront(m));
    expect(m.stemZ + T.crownDiameter / 2).toBeLessThan(caseShape(m).back);
  });
});
