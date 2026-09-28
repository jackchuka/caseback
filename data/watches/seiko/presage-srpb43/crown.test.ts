import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { caseBack, caseFront } from './case';
import { crownX, presageCrown } from './crown';
import { P } from './params';

const m = movementFrame(calibers['seiko-nh35a']!);

describe('Presage SRPB43 crown', () => {
  const [body, tube] = presageCrown();
  it('turns a large crown with coarse scallops', () => {
    body!.geometry.computeBoundingBox();
    const b = body!.geometry.boundingBox!;
    expect(b.max.x - b.min.x).toBeCloseTo(P.crownDiameter, 1);
    const p = body!.geometry.getAttribute('position');
    const r: number[] = [];
    for (let i = 0; i < p.count; i++) if (Math.abs(p.getY(i)) < P.crownLength / 2 - 0.6) r.push(Math.hypot(p.getX(i), p.getZ(i)));
    expect(Math.min(...r)).toBeLessThan(P.crownDiameter / 2 - 0.3);
  });
  it('sits beyond the case on its tube, within the case middle\'s height', () => {
    tube!.geometry.computeBoundingBox();
    expect(tube!.geometry.boundingBox!.min.y).toBeGreaterThan(0);
    expect(crownX() - P.crownLength / 2).toBeGreaterThan(P.caseRadius);
    expect(m.stemZ - P.crownDiameter / 2).toBeGreaterThan(caseFront(m) - 1.5);
    expect(m.stemZ + P.crownDiameter / 2).toBeLessThan(caseBack(m) + 1.5);
  });
});
