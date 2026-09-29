import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { closedAndOutward } from '../../../../src/scene/exterior/kit/meshCheck';
import { surfaceNets } from '../../../../src/scene/exterior/kit/surfaceNets';
import { expectRotorClears, radii, rotorOf, zRange } from '../../../../src/test/geometry';
import { caseFront, caseShape, tudorCase, tudorCaseback } from './case';
import { tudorCrystal } from './crystal';
import tudor79220b from './exterior';
import { T } from './params';

const caliber = calibers['eta-2824-2']!;
const m = movementFrame(caliber);

describe('Tudor 79220B case', () => {
  const s = caseShape(m);
  const mid = (caseFront(m) + s.back) / 2;

  it('leaves exactly the lug width free between the lugs', () => {
    const y = T.lugToLug / 2 - 4;
    expect(s.sdf(T.lugGap / 2 - 0.25, y, mid)).toBeGreaterThan(0);
    expect(s.sdf(T.lugGap / 2 + 0.25, y, mid)).toBeLessThan(0);
  });
  it('has vertical flanks', () => {
    const inset = T.bevel + 0.3;
    expect(s.sdf(-(T.caseRadius - 0.05), 0, caseFront(m) + inset)).toBeLessThan(0);
    expect(s.sdf(-(T.caseRadius - 0.05), 0, s.back - 0.5)).toBeLessThan(0);
    expect(s.sdf(-(T.caseRadius + 0.05), 0, mid)).toBeGreaterThan(0);
  });
  const tip = T.lugToLug / 2;
  const lugX = T.lugGap / 2 + T.lugWidth / 2;
  // Outer edge of the plan outline at height y, found by walking in from the bounds.
  const outerX = (y: number) => {
    let x = T.caseRadius + 0.4;
    while (s.sdf(x, y, mid) > 0) x -= 0.01;
    let hi = x + 0.01;
    while (hi - x > 1e-4) {
      const c = (x + hi) / 2;
      if (s.sdf(c, y, mid) > 0) hi = c; else x = c;
    }
    return x;
  };

  it('curves the lug top down from the bezel edge all the way to the tip', () => {
    const edge = Math.sqrt(T.caseRadius ** 2 - lugX ** 2);
    const dip = (y: number) => s.front(lugX, y) - caseFront(m);
    expect(dip(edge - 0.5)).toBeCloseTo(0, 5);
    expect(dip(edge + 2)).toBeGreaterThan(0.08 * T.lugDrop);
    expect(dip(tip - 0.5)).toBeGreaterThan(0.9 * T.lugDrop);
    for (let y = edge; y < tip; y += 0.5) expect(dip(y + 0.5)).toBeGreaterThan(dip(y));
    expect(s.front(0, T.caseRadius - 0.1)).toBeCloseTo(caseFront(m), 5);
  });
  it('rounds the lug heel up from the flat caseback seat', () => {
    expect(s.sdf(lugX, 0.5 * tip, s.back - 0.3)).toBeLessThan(0);
    expect(s.sdf(lugX, tip - 0.3, s.back - 0.3)).toBeGreaterThan(0);
  });
  it('runs the case edge straight out to the lug tip, with no notch', () => {
    const ys = Array.from({ length: 13 }, (_, i) => 8 + i * 1.25);
    const xs = ys.map(outerX);
    for (let i = 1; i < xs.length; i++) expect(xs[i]!).toBeLessThan(xs[i - 1]!);
    // A concave notch would pull the middle sample inside the chord between its neighbours.
    for (let i = 1; i < xs.length - 1; i++) expect(xs[i]! - (xs[i - 1]! + xs[i + 1]!) / 2).toBeGreaterThan(-0.05);
  });
  it('joins the drum to the lug edge on the tangent, with no bulge along the flank', () => {
    // The tangent from the drum through the tip's outer corner, and its touching point.
    const R = T.caseRadius, xo = T.lugGap / 2 + T.lugWidth;
    const phi = Math.atan2(tip, xo) - Math.acos(R / Math.hypot(xo, tip));
    const tx = R * Math.cos(phi), ty = R * Math.sin(phi);
    const chord = (y: number) => (y < ty ? Math.sqrt(R * R - y * y) : tx + ((y - ty) * (xo - tx)) / (tip - ty));
    for (let y = 5; y <= 12; y += 0.25) expect(Math.abs(outerX(y) - chord(y))).toBeLessThan(0.03);
  });
  it('makes the lugs wide wedges, as measured on the front photo', () => {
    expect(outerX(tip - 1) - T.lugGap / 2).toBeCloseTo(T.lugWidth + 0.35, 0);
    expect(outerX(tip - 5) - T.lugGap / 2).toBeGreaterThan(4);
    expect(outerX(12)).toBeGreaterThan(Math.sqrt(T.caseRadius ** 2 - 12 ** 2) + 1);
  });
  it('polishes the bevel and flank, brushes the top', () => {
    const z = caseFront(m) + T.bevel / 2;
    expect(s.polish(-(T.caseRadius - T.bevel / 2), 0, z)).toBeGreaterThan(0.9);
    expect(s.polish(-(T.caseRadius - T.bevel - 0.6), 0, caseFront(m))).toBeLessThan(0.1);
    expect(s.polish(-T.caseRadius, 0, mid)).toBeGreaterThan(0.9);
  });
  it('drills a blind spring-bar hole from the inner face of each lug', () => {
    expect(s.sdf(T.lugGap / 2 + 0.3, s.hole.y, s.hole.z)).toBeGreaterThan(0);
    expect(s.sdf(T.lugGap / 2 + T.lugWidth - 0.3, s.hole.y, s.hole.z)).toBeLessThan(0);
  });
});

describe('Tudor 79220B case mesh', () => {
  let layers: ExteriorLayer[];
  let g: THREE.BufferGeometry;
  beforeAll(() => {
    layers = tudorCase(m, 0.3);
    g = layers[0]!.geometry;
  });

  it('is 41 mm across and spans the lug-to-lug length', () => {
    g.computeBoundingBox();
    const b = g.boundingBox!;
    expect(b.max.x - b.min.x).toBeCloseTo(2 * T.caseRadius, 0);
    expect(b.max.y - b.min.y).toBeCloseTo(T.lugToLug, 0);
  });
  it('is one closed, outward-facing surface', () => {
    expect(layers).toHaveLength(1);
    const { open, volume } = closedAndOutward(g);
    expect(open).toBe(0);
    expect(volume).toBeGreaterThan(0);
  });
  it('carries a polish attribute per vertex', () => {
    expect(g.getAttribute('polish').count).toBe(g.getAttribute('position').count);
  });
});

describe('Tudor 79220B case build cost', () => {
  // Counted work, not wall time: in the parallel suite a build's wall time mostly measures the machine's load.
  // At the 'high' step (0.2) this measured 5,601,232 calls, 4,130,924 full evaluations and 109,424 vertices; the
  // ceilings sit ~25% above, so losing an early exit or refining the mesh fails while small shape tweaks pass.
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
    expect(work.full).toBeLessThan(5_200_000);
    expect(work.calls).toBeLessThan(7_000_000);
    expect(work.vertices).toBeLessThan(137_000);
  });
  it.skipIf(!process.env.PERF)('builds the whole watch at high quality within 1.5 s (PERF=1)', () => {
    let best = Infinity;
    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      tudor79220b.geometry({ movement: m, quality: 'high' });
      best = Math.min(best, performance.now() - t0);
    }
    expect(best).toBeLessThan(1500);
  });
});

describe('Tudor 79220B thickness and caseback', () => {
  const back = tudorCaseback(m);
  const rotor = rotorOf(caliber);

  it('keeps the rotor inside the case and caseback at the published thickness', () => {
    const front = zRange(tudorCrystal(m))[0];
    const outer = zRange(back)[1];
    expect(outer - front).toBeGreaterThan(T.totalThickness - 0.3);
    expect(outer - front).toBeLessThan(T.totalThickness + 0.3);
    expect(rotor.back).toBeLessThan(outer);
  });
  it('hollows the caseback so the rotor clears it, closed or lifting off', () => {
    const [inner, outer] = zRange(back);
    // The pocket: the solid plate's inner face, and the rim's inner radius.
    const plate = back.find((l) => l.name === 'caseback-solid')!;
    const rim = back.find((l) => l !== plate)!;
    expect(outer - inner).toBeCloseTo(T.casebackThickness, 5);
    expect(closedAndOutward(rim.geometry).volume).toBeGreaterThan(0);
    expect(closedAndOutward(plate.geometry).volume).toBeGreaterThan(0);
    expectRotorClears(rotor, { floor: zRange([plate])[0], pocket: Math.min(...radii(rim.geometry)), span: [inner, outer] });
  });
});
