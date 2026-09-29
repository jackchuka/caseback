import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { closedAndOutward } from '../../../../src/scene/exterior/kit/meshCheck';
import { surfaceNets } from '../../../../src/scene/exterior/kit/surfaceNets';
import { expectRotorClears, radii, rotorOf, zRange } from '../../../../src/test/geometry';
import { bezelTop, caseBack, caseFront, caseShape, sinnCase, sinnCaseback } from './case';
import { S } from './params';

const caliber = calibers['eta-2824-2']!;
const m = movementFrame(caliber);

describe('Sinn 556 case', () => {
  const s = caseShape(m);
  const mid = (caseFront(m) + s.back) / 2;
  // Outer edge of the plan outline at height y on the 9 o'clock side, found by walking in from the bounds.
  const outerX = (y: number) => {
    let x = S.caseRadius + 1.5;
    while (s.sdf(-x, y, mid) > 0) x -= 0.01;
    let hi = x + 0.01;
    while (hi - x > 1e-4) {
      const c = (x + hi) / 2;
      if (s.sdf(-c, y, mid) > 0) hi = c; else x = c;
    }
    return x;
  };

  it('stacks the published 11 mm from the bezel top to the caseback', () => {
    expect(caseBack(m) + S.casebackThickness - bezelTop(m)).toBeCloseTo(11, 5);
  });
  it('leaves exactly the lug width free between the lugs', () => {
    const y = S.lugToLug / 2 - 4;
    expect(s.sdf(S.lugGap / 2 - 0.25, y, mid)).toBeGreaterThan(0);
    expect(s.sdf(S.lugGap / 2 + 0.25, y, mid)).toBeLessThan(0);
  });
  it('is a 38.5 mm drum at 9 o\'clock with vertical flanks', () => {
    expect(outerX(0)).toBeCloseTo(S.caseRadius, 1);
    expect(s.sdf(-(S.caseRadius - 0.05), 0, caseFront(m) + S.bevel + 0.3)).toBeLessThan(0);
    expect(s.sdf(-(S.caseRadius - 0.05), 0, s.back - 0.6)).toBeLessThan(0);
  });
  it('follows the front photo\'s outline from the drum out to the lug tip', () => {
    // photo:front, left side, scale-corrected so the drum reads 19.25 mm.
    const measured: Array<[number, number]> = [[5.58, 18.45], [8.76, 17.2], [10.36, 16.35], [11.95, 15.3], [13.54, 14.5], [15.13, 13.7], [16.73, 13.1], [18.32, 12.6], [19.91, 12.2], [22.3, 11.7]];
    for (const [y, x] of measured) expect(Math.abs(outerX(y) - x), `y=${y}`).toBeLessThan(0.3);
  });
  it('ends the lugs at the published lug-to-lug length', () => {
    expect(s.sdf(-(S.lugGap / 2 + 0.9), S.lugToLug / 2 - 0.2, mid)).toBeLessThan(0);
    expect(s.sdf(-(S.lugGap / 2 + 0.9), S.lugToLug / 2 + 0.1, mid)).toBeGreaterThan(0);
  });
  it('stands two guards out of the 3 o\'clock flank with the crown\'s notch between them', () => {
    const z = (caseFront(m) + s.back) / 2;
    expect(s.sdf(S.guard.outer - 0.2, (S.guard.notch + S.guard.flat) / 2, z)).toBeLessThan(0);
    expect(s.sdf(S.guard.outer + 0.1, (S.guard.notch + S.guard.flat) / 2, z)).toBeGreaterThan(0);
    expect(s.sdf(S.caseRadius + 0.3, 0, z)).toBeGreaterThan(0);
    // Nothing on the 9 o'clock side.
    expect(s.sdf(-(S.caseRadius + 0.3), (S.guard.notch + S.guard.flat) / 2, z)).toBeGreaterThan(0);
  });
  it('drops the lug tops toward the wrist, not the guards', () => {
    const lugX = S.lugGap / 2 + 0.9;
    expect(s.front(lugX, S.lugToLug / 2 - 0.3) - caseFront(m)).toBeGreaterThan(0.8 * S.lugDrop);
    expect(s.front(S.guard.outer - 0.3, S.guard.flat - 0.3)).toBeCloseTo(caseFront(m), 5);
  });
  it('drills the spring-bar holes right through the lugs', () => {
    expect(s.sdf(S.lugGap / 2 + 0.3, s.hole.y, s.hole.z)).toBeGreaterThan(0);
    expect(s.sdf(S.lugGap / 2 + 2.5, s.hole.y, s.hole.z)).toBeGreaterThan(0);
    expect(s.sdf(S.lugGap / 2 + 0.9, s.hole.y, s.hole.z + S.holeRadius + 0.3)).toBeLessThan(0);
  });
  it('brushes the faces and polishes only the top bevel', () => {
    const lugX = S.lugGap / 2 + 0.9;
    expect(s.polish(lugX, 15, s.front(lugX, 15))).toBeLessThan(0.1);
    expect(s.polish(-S.caseRadius, 0, mid)).toBeLessThan(0.1);
    expect(s.polish(-(S.caseRadius - S.bevel / 2), 0, caseFront(m) + S.bevel / 2)).toBeGreaterThan(0.9);
  });
});

describe('Sinn 556 case mesh', () => {
  let layers: ExteriorLayer[];
  let g: THREE.BufferGeometry;
  beforeAll(() => {
    layers = sinnCase(m, 0.3);
    g = layers[0]!.geometry;
  });
  it('spans the lug-to-lug length and the guards', () => {
    g.computeBoundingBox();
    const b = g.boundingBox!;
    expect(b.max.y - b.min.y).toBeCloseTo(S.lugToLug, 0);
    expect(b.max.x).toBeCloseTo(S.guard.outer, 0);
    expect(-b.min.x).toBeCloseTo(S.caseRadius, 0);
  });
  it('is one closed, outward-facing surface carrying a polish attribute', () => {
    const { open, volume } = closedAndOutward(g);
    expect(open).toBe(0);
    expect(volume).toBeGreaterThan(0);
    expect(g.getAttribute('polish').count).toBe(g.getAttribute('position').count);
  });
});

describe('Sinn 556 case build cost', () => {
  // Counted work, not wall time. At the 'high' step (0.2) this measured 5,032,698 calls, 3,634,653 full evaluations and
  // 96,574 vertices; the ceilings sit ~25% above.
  const work = { calls: 0, full: 0, vertices: 0 };
  beforeAll(() => {
    const counter = { full: 0 };
    const cs = caseShape(m, counter);
    const counted = (x: number, y: number, z: number) => { work.calls++; return cs.sdf(x, y, z); };
    const b = cs.bounds;
    work.vertices = surfaceNets(counted, [-b.x, -b.y, b.z[0]], [b.x, b.y, b.z[1]], 0.2).getAttribute('position').count;
    work.full = counter.full;
  });
  it('keeps the high-quality build within its work budget', () => {
    expect(work.full).toBeLessThan(BUDGET.full);
    expect(work.calls).toBeLessThan(BUDGET.calls);
    expect(work.vertices).toBeLessThan(BUDGET.vertices);
  });
});
const BUDGET = { full: 4_550_000, calls: 6_300_000, vertices: 121_000 };

describe('Sinn 556 display caseback', () => {
  const back = sinnCaseback(m);
  const rotor = rotorOf(caliber);
  it('shows the movement through a sapphire', () => {
    expect(back.map((l) => l.name)).toContain('caseback-glass');
  });
  it('keeps the rotor clear of the glass and the ring, closed or lifting off', () => {
    const [inner, outer] = zRange(back);
    const glass = back.find((l) => l.name === 'caseback-glass')!;
    const ring = back.find((l) => l !== glass)!;
    expect(outer - inner).toBeCloseTo(S.casebackThickness, 5);
    expectRotorClears(rotor, { floor: zRange([glass])[0], pocket: Math.min(...radii(ring.geometry)), span: [inner, outer] });
  });
});
