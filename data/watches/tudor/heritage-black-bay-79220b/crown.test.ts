import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { crownX, tudorCrown } from './crown';
import { T } from './params';

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
    void THREE;
  });
});
