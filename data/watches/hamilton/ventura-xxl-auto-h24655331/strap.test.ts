import { describe, expect, it } from 'vitest';
import { V } from './params';
import { planFields } from './plan';
import { strapZ, venturaStrap } from './strap';

describe('Ventura rubber strap', () => {
  const pieces = venturaStrap();
  it('has two halves, offset toward 9 o\'clock as on the photo', () => {
    expect(pieces).toHaveLength(2);
    for (const s of pieces) {
      s.geometry.computeBoundingBox();
      const b = s.geometry.boundingBox!;
      expect((b.min.x + b.max.x) / 2).toBeCloseTo(V.strap.offsetX, 1);
      expect(b.max.x - b.min.x).toBeCloseTo(V.strap.width, 1);
    }
  });
  it('starts hidden under the case, with no lugs or spring bars', () => {
    const { tiers } = planFields();
    const inside = (x: number) => Math.min(...tiers.map((f) => f(x, V.strap.start)));
    for (const x of [-V.strap.width / 2, 0, V.strap.width / 2]) expect(inside(V.strap.offsetX + x)).toBeLessThan(-1);
    expect(strapZ() - V.strap.thickness / 2).toBeGreaterThan(0);
  });
  it('curves both halves toward the wrist', () => {
    for (const s of pieces) expect(s.geometry.boundingBox!.max.z).toBeGreaterThan(V.strap.wristRadius / 2);
  });
  it('is black rubber all round', () => {
    for (const s of pieces) expect(s.material).toBe('strap');
  });
});
