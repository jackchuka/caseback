import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { caseBack } from './case';
import { crownRadius, venturaCrown } from './crown';
import { V } from './params';

const m = movementFrame(calibers['eta-2824-2']!);

describe('Ventura crown', () => {
  const body = venturaCrown().find((l) => l.material === 'polished')!.geometry;
  body.computeBoundingBox();
  const b = body.boundingBox!;
  const radii = (from: number, to: number) => {
    const p = body.getAttribute('position');
    const r: number[] = [];
    for (let i = 0; i < p.count; i++) if (p.getY(i) > from && p.getY(i) < to) r.push(Math.hypot(p.getX(i), p.getZ(i)));
    return r;
  };
  it('is fluted at full diameter by the housing and tapers to a smaller end', () => {
    expect(b.max.y - b.min.y).toBeCloseTo(V.crownLength, 2);
    const grip = radii(b.max.y - 1, b.max.y - 0.3);
    expect(Math.max(...grip)).toBeCloseTo(V.crownDiameter / 2, 1);
    expect(Math.min(...grip.filter((r) => r > 2))).toBeLessThan(V.crownDiameter / 2 - 0.25);
    expect(Math.max(...radii(b.min.y - 0.01, b.min.y + 0.05))).toBeLessThan(V.crownEndDiameter / 2 + 0.3);
  });
  it('starts at the housing\'s outer face and ends 46 mm from the 9 o\'clock tip', () => {
    expect(crownRadius() - V.crownLength / 2).toBeCloseTo(V.housing.collar[1], 5);
  });
  it('sits on the stem axis inside the housing\'s height', () => {
    expect(m.stemZ - V.crownDiameter / 2).toBeGreaterThan(V.housing.top);
    expect(m.stemZ + V.crownDiameter / 2).toBeLessThan(caseBack());
  });
});
