import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { closedAndOutward } from '../../../../src/scene/exterior/kit/meshCheck';
import { surfaceNets } from '../../../../src/scene/exterior/kit/surfaceNets';
import { expectRotorClears, rotorOf, zRange } from '../../../../src/test/geometry';
import { caseBack, caseFront, caseShape, crystalFront, venturaCase } from './case';
import { casebackOuter, venturaCaseback } from './caseback';
import { crownX } from './crown';
import { venturaCrystal } from './crystal';
import ventura from './exterior';
import { mirrored, PHOTO, TRACE, V } from './params';
import { outlines, planFields } from './plan';

const caliber = calibers['eta-2824-2']!;
const m = movementFrame(caliber);
const toMm = ([x, y]: [number, number]): [number, number] => [(x - PHOTO.pivot[0]) * PHOTO.mmPerPx, (y - PHOTO.pivot[1]) * PHOTO.mmPerPx];

describe('Ventura plan', () => {
  it('is 45.5 mm from 12 to 6 and 46 mm from the 9 o\'clock tip to the crown\'s end', () => {
    const all = [...outlines.tier0, ...outlines.tier1, ...outlines.tier2];
    const ys = all.map(([, y]) => y), xs = all.map(([x]) => x);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(V.height, 0);
    expect(crownX() + V.crownLength / 2 - Math.min(...xs)).toBeCloseTo(V.width, 0);
  });
  it('closes each traced half across the 3–9 line into a mirror-symmetric outline', () => {
    const o = mirrored(TRACE.tier0);
    expect(o).toHaveLength(2 * TRACE.tier0.length - 2);
    const { tiers } = planFields();
    for (const [x, y] of [[-10, 12], [5, -18], [18, 8]] as const) expect(tiers[0]!(x, y)).toBeCloseTo(tiers[0]!(x, -y), 6);
  });
  it('nests the wing steps: each tier reaches past the one above it only on the wings', () => {
    const { tiers } = planFields();
    // On the upper-left wing, between the grooves, only the lower tiers are solid.
    const [x, y] = toMm([740, 600]);
    expect(tiers[0]!(x, y)).toBeGreaterThan(0);
    expect(tiers[1]!(x, y)).toBeLessThan(0);
    const [x2, y2] = toMm([740, 530]);
    expect(tiers[1]!(x2, y2)).toBeGreaterThan(0);
    expect(tiers[2]!(x2, y2)).toBeLessThan(0);
    // The crown side is all tier 0.
    expect(tiers[0]!(20.5, 0)).toBeLessThan(0);
    expect(tiers[1]!(20.5, 0)).toBeGreaterThan(0);
  });
  it('holds the round movement inside the dial opening, with room to spare', () => {
    const { dial } = planFields();
    for (let a = 0; a < 360; a += 5) {
      const t = (a * Math.PI) / 180;
      expect(dial(Math.cos(t) * (V.seat + 0.3), Math.sin(t) * (V.seat + 0.3))).toBeLessThan(0);
    }
    expect(V.seat).toBeGreaterThan(m.diameterMm / 2);
  });
});

describe('Ventura case', () => {
  const s = caseShape(m);
  it('steps each wing tier down toward the back, below the rolled main front', () => {
    expect(s.fronts[1]! - s.fronts[0]!).toBeCloseTo(V.tierDrop, 6);
    expect(V.tierDrop).toBeGreaterThan(V.crown0);
    const [x, y] = toMm([740, 600]);
    expect(s.sdf(x, y, s.fronts[1]! + 0.3)).toBeLessThan(0);
    expect(s.sdf(x, y, s.fronts[0]! + 0.3)).toBeGreaterThan(0);
  });
  it('rolls the main front back from the dial edge to its outer edge', () => {
    const { dial, tiers } = planFields();
    expect(s.roll(dial(0, -17.5), tiers[0]!(0, -17.5))).toBeGreaterThan(0.6 * V.crown0);
    expect(s.roll(0.05, -4)).toBeLessThan(0.01);
  });
  it('opens over the dial down to the seat, then round the movement to the back', () => {
    expect(s.sdf(0, -14, crystalFront())).toBeGreaterThan(0);
    expect(s.sdf(0, -14, m.dialZ - 0.2)).toBeGreaterThan(0);
    expect(s.sdf(0, -14, m.dialZ + 0.6)).toBeLessThan(0);
    expect(s.sdf(0, -V.seat + 0.3, 2)).toBeGreaterThan(0);
    expect(s.sdf(-V.seat - 0.5, 0, 2)).toBeLessThan(0);
  });
  it('carries the crown housing: the collar stands proud of the front, the nose rests on the crystal', () => {
    expect(s.sdf(19, 0, V.housing.top + 0.2)).toBeLessThan(0);
    expect(s.sdf(19, 0, caseFront() - 0.3)).toBeLessThan(0);
    // The nose reaches over the dial to its point but not behind the crystal's face.
    expect(s.sdf(V.housing.tip + 0.4, 0, crystalFront() - 0.15)).toBeLessThan(0);
    expect(s.sdf(V.housing.tip + 0.4, 0, crystalFront() + 0.1)).toBeGreaterThan(0);
    expect(s.sdf(V.housing.tip - 0.3, 0, crystalFront() - 0.15)).toBeGreaterThan(0);
  });
  it('makes the housing a bullet standing 1.5–2 mm proud of the flank, filleted into it', () => {
    const top = (x: number) => { let z = V.housing.top - 0.5; while (s.sdf(x, 0, z) > 0) z += 0.01; return z; };
    const proud = s.sdf(20.5, 0, caseFront() + 0.2) < 0 ? caseFront() - top(20.5) : NaN;
    expect(proud).toBeGreaterThan(1.5);
    expect(proud).toBeLessThan(2.1);
    // Just beside the collar, a little in front of the case face, the fillet fills the corner a plain union would leave.
    const z = caseFront() - 0.05;
    const edge = V.housing.halfWidth * (1 - ((z - m.stemZ) / (m.stemZ - V.housing.top)) ** 4) ** 0.25;
    expect(s.sdf(19.5, edge + 0.1, z)).toBeLessThan(0);
    expect(s.sdf(19.5, edge + 1.5, z)).toBeGreaterThan(0);
  });
  it('bulges the flanks: widest at mid-height, drawn in toward front and back', () => {
    expect(s.barrel((s.fronts[0]! + s.back) / 2)).toBeCloseTo(0, 6);
    expect(s.barrel(s.back)).toBeCloseTo(V.barrel, 6);
    const mid = (s.fronts[0]! + s.back) / 2;
    expect(s.sdf(-21.0 + 0.1, 0, mid)).toBeLessThan(0);
    expect(s.sdf(-21.0 + 0.1, 0, s.back - 0.8)).toBeGreaterThan(0);
  });
  it('pierces the nose with the triangular window', () => {
    const w = V.housing.window;
    expect(s.sdf((w.from + w.to) / 2 + 0.8, 0, crystalFront() - 0.2)).toBeGreaterThan(0);
    expect(s.sdf(w.to + 0.6, 0, crystalFront() - 0.2)).toBeLessThan(0);
  });
});

describe('Ventura case mesh', () => {
  let layers: ExteriorLayer[];
  let g: THREE.BufferGeometry;
  beforeAll(() => {
    layers = venturaCase(m, 0.3);
    g = layers[0]!.geometry;
  });
  it('spans the traced outline and the collar', () => {
    g.computeBoundingBox();
    const b = g.boundingBox!;
    expect(b.max.y - b.min.y).toBeCloseTo(V.height, 0);
    expect(b.max.x).toBeCloseTo(V.housing.collar[1], 0);
  });
  it('is one closed, outward-facing surface', () => {
    const { open, volume } = closedAndOutward(g);
    expect(open).toBe(0);
    expect(volume).toBeGreaterThan(0);
  });
});

describe('Ventura case build cost', () => {
  // Counted work, not wall time. At the 'high' step (0.2) this measured 4,777,000 full evaluations, 6,297,000 calls
  // and 118,300 vertices; the ceilings sit ~25% above, so losing an early exit or refining the mesh fails.
  const work = { calls: 0, full: 0, vertices: 0 };
  beforeAll(() => {
    const counter = { full: 0 };
    const cs = caseShape(m, counter);
    const counted = (x: number, y: number, z: number) => { work.calls++; return cs.sdf(x, y, z); };
    const b = cs.bounds;
    work.vertices = surfaceNets(counted, [b.x[0], -b.y, b.z[0]], [b.x[1], b.y, b.z[1]], 0.2).getAttribute('position').count;
    work.full = counter.full;
  });
  it('keeps the high-quality build within its work budget', () => {
    expect(work.full).toBeLessThan(6_000_000);
    expect(work.calls).toBeLessThan(7_900_000);
    expect(work.vertices).toBeLessThan(148_000);
  });
  it.skipIf(!process.env.PERF)('builds the whole watch at high quality within 1.5 s (PERF=1)', () => {
    let best = Infinity;
    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      ventura.geometry({ movement: m, quality: 'high' });
      best = Math.min(best, performance.now() - t0);
    }
    expect(best).toBeLessThan(1500);
  });
});

describe('Ventura thickness and caseback', () => {
  const back = venturaCaseback();
  const rotor = rotorOf(caliber);
  it('is 11.25 mm from the crystal to the back\'s outer face', () => {
    expect(casebackOuter() - zRange(venturaCrystal())[0]).toBeCloseTo(V.totalThickness, 2);
  });
  it('seats the back on the case middle\'s back face', () => {
    expect(zRange(back)[0]).toBeCloseTo(caseBack(), 5);
  });
  it('keeps the rotor clear of the glass, closed or lifting off', () => {
    const glass = back.find((l) => l.name === 'caseback-glass')!;
    expectRotorClears(rotor, { floor: zRange([glass])[0] });
  });
});
