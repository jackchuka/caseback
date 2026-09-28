import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { caseShape } from './case';
import { tudorBracelet } from './bracelet';
import { T } from './params';

const m = movementFrame(calibers['eta-2824-2']!);

describe('Tudor 79220B bracelet', () => {
  const layers = tudorBracelet(m);
  const ends = layers.filter((l) => l.name === 'end-link');
  it('fits an end link between each pair of lugs', () => {
    expect(ends).toHaveLength(2);
    for (const e of ends) {
      e.geometry.computeBoundingBox();
      const b = e.geometry.boundingBox!;
      expect(b.max.x - b.min.x).toBeLessThanOrEqual(T.lugGap);
      expect(b.max.x - b.min.x).toBeGreaterThan(T.lugGap - 1);
    }
  });
  it('keeps the end links clear of the case', () => {
    const s = caseShape(m);
    for (const e of ends) {
      const p = e.geometry.getAttribute('position');
      for (let i = 0; i < p.count; i += 7) expect(s.sdf(p.getX(i), p.getY(i), p.getZ(i))).toBeGreaterThan(-0.15);
    }
  });
  it('continues into three-piece links', () => {
    expect(layers.filter((l) => l.name === 'bracelet-center').length).toBe(T.bracelet.links * 2);
  });
});
