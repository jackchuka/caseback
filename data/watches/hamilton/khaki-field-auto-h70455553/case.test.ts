import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { buildShape } from '../../../../src/geometry/parts';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { closedAndOutward } from '../../../../src/scene/exterior/kit/meshCheck';
import { surfaceNets } from '../../../../src/scene/exterior/kit/surfaceNets';
import { openingDuration, openingPose } from '../../../../src/scene/opening';
import { caseBack, caseFront, caseShape, hamiltonCase } from './case';
import { hamiltonCaseback } from './caseback';
import { hamiltonCrystal } from './crystal';
import khakiField from './exterior';
import { H } from './params';

const caliber = calibers['eta-2824-2']!;
const m = movementFrame(caliber);
const zRange = (ls: { geometry: THREE.BufferGeometry }[], dz = 0) => {
  const b = new THREE.Box3();
  for (const l of ls) { l.geometry.computeBoundingBox(); b.union(l.geometry.boundingBox!); }
  return [b.min.z + dz, b.max.z + dz] as const;
};

describe('Khaki Field case', () => {
  const s = caseShape(m);
  const mid = (caseFront(m) + s.back) / 2;
  const tip = H.lugToLug / 2;
  // Outer edge of the plan outline at height y, found by walking in from the bounds.
  const outerX = (y: number) => {
    let x = H.caseRadius + 0.4;
    while (s.sdf(x, y, mid) > 0) x -= 0.01;
    let hi = x + 0.01;
    while (hi - x > 1e-4) {
      const c = (x + hi) / 2;
      if (s.sdf(c, y, mid) > 0) hi = c; else x = c;
    }
    return x;
  };

  it('leaves exactly the lug width free between the lugs', () => {
    const y = tip - 3;
    expect(s.sdf(H.lugGap / 2 - 0.2, y, mid)).toBeGreaterThan(0);
    expect(s.sdf(H.lugGap / 2 + 0.2, y, mid)).toBeLessThan(0);
  });
  it('is a 38 mm drum with vertical flanks at 3 and 9 o\'clock', () => {
    expect(s.sdf(-(H.caseRadius - 0.05), 0, caseFront(m) + H.bevel + 0.3)).toBeLessThan(0);
    expect(s.sdf(-(H.caseRadius - 0.05), 0, s.back - 0.6)).toBeLessThan(0);
    expect(s.sdf(-(H.caseRadius + 0.05), 0, mid)).toBeGreaterThan(0);
  });
  it('follows the lug outline measured on the front photo', () => {
    // (|y|, x) in mm from teddy-front.jpg, 12 and 6 o'clock lugs.
    const photo: Array<[number, number]> = [
      [10.8, 15.85], [11.15, 15.68], [12.8, 14.92], [13.35, 14.75], [14.5, 14.33], [15.9, 13.9],
      [16.2, 13.74], [17.6, 13.48], [18.76, 13.06], [20.1, 12.9], [20.45, 12.64], [21.8, 12.55],
    ];
    for (const [y, x] of photo) expect(Math.abs(outerX(y) - x), `y=${y}`).toBeLessThan(0.2);
  });
  it('keeps to the drum until the lug leaves it, with no bulge or notch', () => {
    for (let y = 0; y < H.lugLeave; y += 0.5) expect(outerX(y)).toBeCloseTo(Math.sqrt(H.caseRadius ** 2 - y * y), 1);
    const ys = Array.from({ length: 24 }, (_, i) => 6 + i * 0.7);
    const xs = ys.map(outerX);
    for (let i = 1; i < xs.length; i++) expect(xs[i]!).toBeLessThan(xs[i - 1]!);
  });
  it('curves the lug top down toward the wrist from the drum edge to the tip', () => {
    const x = H.lugGap / 2 + 1;
    const edge = Math.sqrt(H.caseRadius ** 2 - x ** 2);
    const dip = (y: number) => s.front(x, y) - caseFront(m);
    expect(dip(edge - 0.5)).toBeCloseTo(0, 5);
    expect(dip(tip - 0.3)).toBeGreaterThan(0.9 * H.lugDrop);
    for (let y = edge; y < tip; y += 0.5) expect(dip(y + 0.5)).toBeGreaterThan(dip(y));
  });
  it('polishes only the bevel; top and flank are brushed', () => {
    const z = caseFront(m) + H.bevel / 2;
    expect(s.polish(-(H.caseRadius - H.bevel / 2), 0, z)).toBeGreaterThan(0.9);
    expect(s.polish(-(H.caseRadius - H.bevel - 0.3), 0, caseFront(m))).toBeLessThan(0.1);
    expect(s.polish(-H.caseRadius, 0, mid)).toBeLessThan(0.1);
  });
  it('drills a blind spring-bar hole from the inner face of each lug', () => {
    expect(s.sdf(H.lugGap / 2 + 0.3, s.hole.y, s.hole.z)).toBeGreaterThan(0);
    expect(s.sdf(H.lugTip - 0.3, s.hole.y, s.hole.z)).toBeLessThan(0);
  });
});

describe('Khaki Field case mesh', () => {
  let layers: ExteriorLayer[];
  let g: THREE.BufferGeometry;
  beforeAll(() => {
    layers = hamiltonCase(m, 0.3);
    g = layers[0]!.geometry;
  });

  it('is 38 mm across and spans the lug-to-lug length', () => {
    g.computeBoundingBox();
    const b = g.boundingBox!;
    expect(b.max.x - b.min.x).toBeCloseTo(2 * H.caseRadius, 0);
    expect(b.max.y - b.min.y).toBeCloseTo(H.lugToLug, 0);
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

describe('Khaki Field case build cost', () => {
  // Counted work, not wall time. At the 'high' step (0.2) this measured 3,486,112 full evaluations, 4,779,384 calls
  // and 93,736 vertices; the ceilings sit ~25% above, so losing an early exit or refining the mesh fails.
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
    expect(work.full).toBeLessThan(4_400_000);
    expect(work.calls).toBeLessThan(6_000_000);
    expect(work.vertices).toBeLessThan(118_000);
  });
  it.skipIf(!process.env.PERF)('builds the whole watch at high quality within 1.5 s (PERF=1)', () => {
    let best = Infinity;
    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      khakiField.geometry({ movement: m, quality: 'high' });
      best = Math.min(best, performance.now() - t0);
    }
    expect(best).toBeLessThan(1500);
  });
});

describe('Khaki Field thickness and caseback', () => {
  const back = hamiltonCaseback(m);
  const rotor = caliber.parts.find((p) => p.id === 'rotor')!;
  const [rotorFront, rotorBack] = zRange(buildShape(rotor.shape, rotor.material as never), rotor.pos.z);
  const rotorRadius = rotor.shape.kind === 'rotor' ? rotor.shape.radius : NaN;
  const margin = 0.05;

  it('is 11 mm from the crystal apex to the caseback', () => {
    const front = zRange(hamiltonCrystal(m))[0];
    const outer = zRange(back)[1];
    expect(outer - front).toBeCloseTo(H.totalThickness, 1);
  });
  it('seats the back on the case middle\'s back face', () => {
    expect(zRange(back)[0]).toBeCloseTo(caseBack(m), 5);
  });
  it('keeps the rotor clear of the window and the ring, closed or lifting off', () => {
    const [inner, outer] = zRange(back);
    const glass = back.find((l) => l.name === 'caseback-glass')!;
    const floor = zRange([glass])[0];
    expect(floor - rotorBack).toBeGreaterThanOrEqual(margin);
    expect(H.casebackWindow - rotorRadius).toBeGreaterThanOrEqual(margin);
    for (let t = 0; t <= openingDuration(); t += 0.01) {
      const p = openingPose(t);
      if (rotorBack + p.rotorLift <= inner + p.casebackLift || rotorFront + p.rotorLift >= outer + p.casebackLift) continue;
      expect(floor + p.casebackLift - (rotorBack + p.rotorLift)).toBeGreaterThanOrEqual(margin);
      expect(H.casebackWindow - (p.rotorSlide + rotorRadius)).toBeGreaterThanOrEqual(margin);
    }
  });
});
