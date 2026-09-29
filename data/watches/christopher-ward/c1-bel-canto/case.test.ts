import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { closedAndOutward } from '../../../../src/scene/exterior/kit/meshCheck';
import { surfaceNets } from '../../../../src/scene/exterior/kit/surfaceNets';
import { zRange } from '../../../../src/test/geometry';
import { belCantoBezel, belCantoCase, caseBack, caseFront, caseShape, caseStepZ } from './case';
import { belCantoCaseback } from './caseback';
import { belCantoCrystal } from './crystal';
import belCanto from './exterior';
import { P } from './params';

const m = movementFrame(calibers['cw-fs01']!);

describe('Bel Canto case', () => {
  const s = caseShape(m);
  const tip = P.lugToLug / 2;
  const lw = P.lugGap / 2;
  // Mid-height of the upright case band, and of the lug near its tip.
  const band = (caseStepZ(m) + caseBack(m)) / 2;
  const lugMid = (y: number) => (s.lugFront(lw + 1, y) + s.lugUnder(y)) / 2;
  // Walks out along a direction until the solid ends.
  const reach = (dir: [number, number], z: number, from = P.flangeTop + 0.2) => {
    let r = from;
    while (s.sdf(dir[0] * r, dir[1] * r, z) < 0) r += 0.005;
    return r;
  };
  const outerX = (y: number) => {
    let x = lw + 0.3;
    while (s.sdf(x, y, lugMid(y)) < 0) x += 0.005;
    return x;
  };

  it('is 41 mm across at the step, clear of the lugs, crown and pusher', () => {
    for (const deg of [0, 150, 180, 210]) {
      const a = (deg * Math.PI) / 180;
      expect(reach([Math.cos(a), Math.sin(a)], caseStepZ(m) + 0.5), `${deg}°`).toBeCloseTo(P.caseRadius, 1);
    }
    expect(s.sdf(-(P.caseRadius - 0.05), 0, band)).toBeLessThan(0);
    expect(s.sdf(-(P.caseRadius + 0.05), 0, band)).toBeGreaterThan(0);
  });
  it('slopes its brushed flank from the bezel out to the step', () => {
    expect(reach([-1, 0], caseFront(m) + 0.1)).toBeLessThan(P.bezelOuter + 0.2);
    const mid = (caseFront(m) + caseStepZ(m)) / 2;
    expect(reach([-1, 0], mid)).toBeGreaterThan(P.bezelOuter + 0.3);
    expect(reach([-1, 0], mid)).toBeLessThan(P.caseRadius - 0.3);
  });
  it('spans 48 mm from lug tip to lug tip', () => {
    // Clear of the spring-bar hole, toward the underside.
    const y = (x: number) => {
      let yy = tip - 3;
      while (s.sdf(x, yy, s.hole.z + P.holeRadius + 0.2) < 0) yy += 0.005;
      return yy;
    };
    expect(Math.abs(2 * y(lw + 0.02) - P.lugToLug)).toBeLessThan(0.1);
  });
  it('leaves exactly the lug width free between the lugs', () => {
    const y = tip - 3;
    expect(s.sdf(lw - 0.1, y, lugMid(y))).toBeGreaterThan(0);
    expect(s.sdf(lw + 0.1, y, lugMid(y))).toBeLessThan(0);
  });
  it('follows the lug outline measured on the front photo', () => {
    // (|y|, x) in mm from front-azzurro-le.jpg, the mean of the four lugs.
    const photo: Array<[number, number]> = [[13.24, 16.04], [15.0, 15.34], [17.36, 14.56], [19.71, 13.98], [21.47, 13.7]];
    for (const [y, x] of photo) expect(Math.abs(outerX(y) - x), `y=${y}`).toBeLessThan(0.15);
  });
  it('turns the lugs down toward the wrist and rolls their tops outward', () => {
    const x = lw + 1;
    const edge = Math.sqrt(P.caseRadius ** 2 - x ** 2);
    expect(s.lugFront(x, tip - 0.3) - s.lugFront(x, edge + 0.5)).toBeGreaterThan(0.8 * P.lugDrop);
    for (let y = edge; y < tip - 0.5; y += 0.5) expect(s.lugFront(x, y + 0.5)).toBeGreaterThanOrEqual(s.lugFront(x, y));
    // Near the tip the outer edge sits lower (further toward the wrist) than the inner edge.
    expect(s.lugFront(lw + 2.4, tip - 1)).toBeGreaterThan(s.lugFront(lw + 0.2, tip - 1) + 0.3);
  });
  it('clears the dial-side module with its bore', () => {
    expect(P.bore).toBeGreaterThan(m.outerRadius);
    expect(s.sdf(m.outerRadius, 0, m.dialZ)).toBeGreaterThan(0);
    expect(s.sdf(0, m.outerRadius, caseBack(m) - 0.5)).toBeGreaterThan(0);
  });
  it('carries the crown\'s neck on its flank along the stem', () => {
    const dir: [number, number] = [Math.cos(m.stemAngle), Math.sin(m.stemAngle)];
    expect(reach(dir, m.stemZ)).toBeCloseTo(P.caseRadius, 1);
  });
  it('carries the chime pusher\'s root on its flank at the pusher\'s angle', () => {
    const at = m.pushers[0]!;
    expect(reach([Math.cos(at.angle), Math.sin(at.angle)], at.z)).toBeGreaterThan(P.pusher.inner + 0.2);
    expect(reach([Math.cos(at.angle), Math.sin(at.angle)], at.z)).toBeLessThan(P.caseRadius + 0.1);
  });
  it('polishes the step line, the flange and the lug chamfers; flank and band are brushed', () => {
    const k = (P.caseRadius - P.bezelOuter) / (caseStepZ(m) - caseFront(m));
    const mid = (caseFront(m) + caseStepZ(m)) / 2;
    expect(s.polish(-(P.bezelOuter + (mid - caseFront(m)) * k), 0, mid)).toBeLessThan(0.1);
    expect(s.polish(-P.caseRadius, 0, band)).toBeLessThan(0.1);
    expect(s.polish(-(P.caseRadius - P.stepBevel / 3), 0, caseStepZ(m))).toBeGreaterThan(0.9);
    expect(s.polish(-(P.bore + P.flangeTop) / 2, 0, (caseFront(m) + m.dialZ) / 2)).toBeGreaterThan(0.9);
    const y = tip - 4;
    expect(s.polish(outerX(y) - P.lugChamfer / 3, y, s.lugFront(outerX(y) - P.lugChamfer, y) + P.lugChamfer / 3)).toBeGreaterThan(0.9);
    expect(s.polish(lw + 1.2, y, lugMid(y) + 0.5)).toBeLessThan(0.5);
  });
  it('drills a blind spring-bar hole from the inner face of each lug', () => {
    expect(s.sdf(lw + 0.3, s.hole.y, s.hole.z)).toBeGreaterThan(0);
    expect(s.sdf(P.lugGap / 2 + P.holeDepth + 0.3, s.hole.y, s.hole.z)).toBeLessThan(0);
  });
});

describe('Bel Canto case mesh', () => {
  let layers: ExteriorLayer[];
  let g: THREE.BufferGeometry;
  beforeAll(() => {
    layers = belCantoCase(m, 0.3);
    g = layers[0]!.geometry;
  });

  it('is 41 mm across and spans the lug-to-lug length', () => {
    g.computeBoundingBox();
    const b = g.boundingBox!;
    expect(b.max.x - b.min.x).toBeCloseTo(2 * P.caseRadius, 0);
    expect(b.max.y - b.min.y).toBeCloseTo(P.lugToLug, 0);
  });
  it('is one closed, outward-facing brushed titanium surface with a polish attribute, and the polished bezel ring', () => {
    expect(layers.map((l) => l.material)).toEqual(['case', 'polished']);
    const { open, volume } = closedAndOutward(g);
    expect(open).toBe(0);
    expect(volume).toBeGreaterThan(0);
    expect(g.getAttribute('polish').count).toBe(g.getAttribute('position').count);
  });
});

describe('Bel Canto bezel', () => {
  const ring = belCantoBezel(m);
  it('is a thin polished ring, separate from the brushed flank', () => {
    expect(ring).toHaveLength(1);
    expect(ring[0]!.material).toBe('polished');
    const p = ring[0]!.geometry.getAttribute('position');
    const r = Array.from({ length: p.count }, (_, i) => Math.hypot(p.getX(i), p.getY(i)));
    expect(Math.min(...r)).toBeCloseTo(P.bezelInner, 1);
    expect(Math.max(...r)).toBeCloseTo(P.bezelOuter, 1);
  });
  it('sits on the case front', () => {
    expect(zRange(ring)[1]).toBeCloseTo(caseFront(m), 5);
  });
});

describe('Bel Canto case build cost', () => {
  // Counted work, not wall time. At the 'high' step (0.2) this measured 3,721,108 full evaluations, 5,275,806 calls
  // and 99,278 vertices; the ceilings sit ~25% above, so losing an early exit or refining the mesh fails.
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
    expect(work.full).toBeLessThan(4_650_000);
    expect(work.calls).toBeLessThan(6_600_000);
    expect(work.vertices).toBeLessThan(124_000);
  });
  it.skipIf(!process.env.PERF)('builds the whole watch at high quality within 1.5 s (PERF=1)', () => {
    let best = Infinity;
    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      belCanto.geometry({ movement: m, quality: 'high' });
      best = Math.min(best, performance.now() - t0);
    }
    expect(best).toBeLessThan(1500);
  });
});

describe('Bel Canto thickness', () => {
  it('is 13 mm from the crystal apex to the caseback', () => {
    const front = zRange(belCantoCrystal(m))[0];
    const outer = zRange(belCantoCaseback(m))[1];
    expect(outer - front).toBeCloseTo(P.totalThickness, 2);
  });
  it('seats the back on the case middle\'s back face', () => {
    expect(zRange(belCantoCaseback(m))[0]).toBeCloseTo(caseBack(m), 5);
  });
});
