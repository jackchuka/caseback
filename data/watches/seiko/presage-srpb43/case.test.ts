import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { buildShape } from '../../../../src/geometry/parts';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { closedAndOutward } from '../../../../src/scene/exterior/kit/meshCheck';
import { openingDuration, openingPose } from '../../../../src/scene/opening';
import { caseBack, caseFront, caseShape, crystalTop, presageCase, presageCaseback } from './case';
import { P } from './params';

const caliber = calibers['seiko-nh35a']!;
const m = movementFrame(caliber);
const zRange = (ls: { geometry: THREE.BufferGeometry }[], dz = 0) => {
  const b = new THREE.Box3();
  for (const l of ls) { l.geometry.computeBoundingBox(); b.union(l.geometry.boundingBox!); }
  return [b.min.z + dz, b.max.z + dz] as const;
};

describe('Presage SRPB43 case', () => {
  const s = caseShape(m);
  const mid = (caseFront(m) + caseBack(m)) / 2;
  it('hangs off the stem axis: the crown centre sits at the measured depth below the crystal apex', () => {
    expect(m.stemZ - crystalTop(m)).toBeCloseTo(P.crystalTopToStem, 9);
    expect(m.stemZ).toBeGreaterThan(caseFront(m) + P.crownDiameter / 2 - 1.5);
    expect(m.stemZ).toBeLessThan(caseBack(m));
  });
  it('leaves exactly the lug width free between the lugs', () => {
    const y = P.lugToLug / 2 - 2;
    const z = (s.front(P.lugGap / 2 + 1, y) + s.underside(P.lugGap / 2 + 1, y)) / 2;
    expect(s.sdf(P.lugGap / 2 - 0.25, y, z)).toBeGreaterThan(0);
    expect(s.sdf(P.lugGap / 2 + 0.6, y, z)).toBeLessThan(0);
  });
  it('is 40.5 mm across its vertical flanks', () => {
    expect(s.sdf(-(P.caseRadius - 0.05), 0, mid)).toBeLessThan(0);
    expect(s.sdf(-(P.caseRadius + 0.05), 0, mid)).toBeGreaterThan(0);
  });
  it('turns the lugs down: the top falls by the measured drop, the underside runs on below the case middle', () => {
    const x = P.lugGap / 2 + P.lugWidth / 2;
    const tip = P.lugToLug / 2 - 0.1;
    expect(s.front(x, tip) - caseFront(m)).toBeGreaterThan(0.95 * P.lugDrop);
    expect(s.underside(x, tip) - caseBack(m)).toBeGreaterThan(0.95 * P.lugBelow);
    for (let y = 18; y < tip; y += 0.5) expect(s.front(x, y + 0.5)).toBeGreaterThanOrEqual(s.front(x, y));
    // Still solid through the bent lug near its tip.
    expect(s.sdf(x, tip - 1, (s.front(x, tip - 1) + s.underside(x, tip - 1)) / 2)).toBeLessThan(0);
  });
});

describe('Presage SRPB43 case mesh', () => {
  let g: THREE.BufferGeometry;
  beforeAll(() => { g = presageCase(m, 0.3)[0]!.geometry; });
  it('spans 40.5 mm and the lug-to-lug length', () => {
    g.computeBoundingBox();
    const b = g.boundingBox!;
    expect(b.max.x - b.min.x).toBeCloseTo(2 * P.caseRadius, 0);
    expect(b.max.y - b.min.y).toBeCloseTo(P.lugToLug, 0);
  });
  it('is one closed, outward-facing surface', () => {
    const { open, volume } = closedAndOutward(g);
    expect(open).toBe(0);
    expect(volume).toBeGreaterThan(0);
  });
});

describe('Presage SRPB43 thickness and display back', () => {
  let back: ExteriorLayer[];
  beforeAll(() => { back = presageCaseback(m); });
  const rotor = caliber.parts.find((p) => p.id === 'rotor')!;
  const [rotorFront, rotorBack] = zRange(buildShape(rotor.shape, rotor.material), rotor.pos.z);
  const rotorRadius = rotor.shape.kind === 'rotor' ? rotor.shape.radius : NaN;

  it('is 11.8 mm from crystal apex to caseback, as published', () => {
    expect(zRange(back)[1] - crystalTop(m)).toBeCloseTo(P.totalThickness, 5);
  });
  it('shows the movement through a glass that clears the rotor, closed or lifting off', () => {
    const glass = back.find((l) => l.name === 'caseback-glass')!;
    const [floor] = zRange([glass]);
    expect(floor - rotorBack).toBeGreaterThanOrEqual(0.05);
    const ring = back.find((l) => l !== glass)!;
    const p = ring.geometry.getAttribute('position');
    let pocket = Infinity;
    for (let i = 0; i < p.count; i++) pocket = Math.min(pocket, Math.hypot(p.getX(i), p.getY(i)));
    expect(pocket - rotorRadius).toBeGreaterThanOrEqual(0.05);
    const [inner, outer] = zRange(back);
    for (let t = 0; t <= openingDuration(); t += 0.01) {
      const q = openingPose(t);
      if (rotorBack + q.rotorLift <= inner + q.casebackLift || rotorFront + q.rotorLift >= outer + q.casebackLift) continue;
      expect(floor + q.casebackLift - (rotorBack + q.rotorLift)).toBeGreaterThanOrEqual(0.05);
      expect(pocket - (q.rotorSlide + rotorRadius)).toBeGreaterThanOrEqual(0.05);
    }
  });
});
