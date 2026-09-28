import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { closedAndOutward } from '../../../../src/scene/exterior/kit/meshCheck';
import { caseShape } from './case';
import { P } from './params';
import { presageStrap, strapPath } from './strap';

const m = movementFrame(calibers['seiko-nh35a']!);

describe('Presage SRPB43 leather strap', () => {
  const layers = presageStrap(m);
  const straps = layers.filter((l) => l.name === 'strap');
  it('runs one closed strap from each pair of lugs', () => {
    expect(straps).toHaveLength(2);
    for (const s of straps) {
      const { open, volume } = closedAndOutward(s.geometry);
      expect(open).toBe(0);
      expect(volume).toBeGreaterThan(0);
    }
  });
  it('fits between the lugs and passes the spring bar', () => {
    for (const s of straps) {
      s.geometry.computeBoundingBox();
      const b = s.geometry.boundingBox!;
      expect(b.max.x - b.min.x).toBeLessThan(P.lugGap);
    }
    const c = caseShape(m);
    const path = strapPath(m);
    let best = Infinity;
    for (let t = 0; t < path.straight; t += 0.05) {
      const { p } = path.at(t);
      best = Math.min(best, Math.hypot(p[0] - c.hole.y, p[1] - c.hole.z));
    }
    expect(best).toBeLessThan(0.1);
  });
  it('keeps clear of the case', () => {
    const c = caseShape(m);
    for (const s of straps) {
      const p = s.geometry.getAttribute('position');
      for (let i = 0; i < p.count; i += 3) expect(c.sdf(p.getX(i), p.getY(i), p.getZ(i))).toBeGreaterThan(-0.2);
    }
  });
  it('curves toward the wrist and carries blue stitching along both edges', () => {
    const path = strapPath(m);
    const end = path.at(path.length).p, before = path.at(path.length - 1).p;
    // Far round the wrist: well behind the watch and heading back under it.
    expect(end[1] - path.start[1]).toBeGreaterThan(20);
    expect(end[0]).toBeLessThan(before[0]);
    expect(layers.filter((l) => l.material === 'stitch').length).toBeGreaterThan(20);
  });
});
