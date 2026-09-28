import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { sinnBracelet } from './bracelet';
import { caseShape } from './case';
import { S } from './params';

const m = movementFrame(calibers['eta-2824-2']!);

describe('Sinn 556 bracelet', () => {
  const layers = sinnBracelet(m);
  const ends = layers.filter((l) => l.name === 'end-link');
  it('fits an end link between each pair of lugs, clear of the case', () => {
    expect(ends).toHaveLength(2);
    const s = caseShape(m);
    for (const e of ends) {
      e.geometry.computeBoundingBox();
      const b = e.geometry.boundingBox!;
      expect(b.max.x - b.min.x).toBeLessThanOrEqual(S.lugGap);
      expect(b.max.x - b.min.x).toBeGreaterThan(S.lugGap - 1);
      const p = e.geometry.getAttribute('position');
      for (let i = 0; i < p.count; i += 7) expect(s.sdf(p.getX(i), p.getY(i), p.getZ(i))).toBeGreaterThan(-0.15);
    }
  });
  it('continues into H-links with a centre link in each', () => {
    expect(layers.filter((l) => l.name === 'bracelet-center')).toHaveLength(S.bracelet.links * 2);
    expect(layers.filter((l) => l.name === 'bracelet-bar')).toHaveLength(S.bracelet.links * 2);
  });
});
