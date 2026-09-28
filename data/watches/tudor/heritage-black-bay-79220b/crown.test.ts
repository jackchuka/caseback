import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { crownX, tudorCrown } from './crown';
import { calibers } from '../../../calibers';
import { buildShape } from '../../../../src/geometry/parts';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { closedAndOutward } from '../../../../src/scene/exterior/kit/meshCheck';
import { openingDuration, openingPose } from '../../../../src/scene/opening';
import { caseFront, caseShape } from './case';
import { tudorCrystal } from './crystal';
import tudor79220b from './exterior';
import { T } from './params';

const caliber = calibers['eta-2824-2']!;
const m = movementFrame(caliber);
const zRange = (ls: { geometry: THREE.BufferGeometry }[], dz = 0) => {
  const b = new THREE.Box3();
  for (const l of ls) { l.geometry.computeBoundingBox(); b.union(l.geometry.boundingBox!); }
  return [b.min.z + dz, b.max.z + dz] as const;
};

describe('Tudor 79220B crown', () => {
  const layers = tudorCrown();
  const body = layers.find((l) => l.material === 'polished')!.geometry;
  it('turns a fluted big crown at the set size', () => {
    body.computeBoundingBox();
    const b = body.boundingBox!;
    expect(b.max.y - b.min.y).toBeCloseTo(T.crownLength, 0);
    const p = body.getAttribute('position');
    const r: number[] = [];
    for (let i = 0; i < p.count; i++) if (Math.abs(p.getY(i)) < T.crownLength / 2 - 0.5) r.push(Math.hypot(p.getX(i), p.getZ(i)));
    expect(Math.max(...r)).toBeCloseTo(T.crownDiameter / 2, 1);
    expect(Math.min(...r.filter((x) => x > T.crownDiameter / 4))).toBeLessThan(T.crownDiameter / 2 - 0.08);
  });
  it('has a tube toward the case and sits beyond it', () => {
    const tube = layers.find((l) => l.material === 'steel')!.geometry;
    tube.computeBoundingBox();
    expect(tube.boundingBox!.min.y).toBeGreaterThan(0);
    expect(crownX() - T.crownLength / 2).toBeGreaterThan(T.caseRadius);
    void THREE;
  });
  it('sits at the measured depth on the flank, 4.4 mm behind the case front', () => {
    expect(m.stemZ - caseFront(m)).toBeCloseTo(4.4, 1);
    expect(m.stemZ - T.crownDiameter / 2).toBeGreaterThan(caseFront(m));
    expect(m.stemZ + T.crownDiameter / 2).toBeLessThan(caseShape(m).back);
  });
  let built: ReturnType<typeof tudor79220b> | undefined;
  const build = () => (built ??= tudor79220b({ movement: m, quality: 'low' }));
  it('keeps the rotor inside the case and caseback, at most 1.6 mm over the published thickness', () => {
    const front = zRange(tudorCrystal(m))[0];
    const back = zRange(build().parts.caseback)[1];
    expect(back - front).toBeLessThanOrEqual(T.totalThickness + 1.6);
    const rotor = caliber.parts.find((p) => p.id === 'rotor')!;
    const rotorBack = zRange(buildShape(rotor.shape, rotor.material as never), rotor.pos.z)[1];
    expect(rotorBack).toBeLessThan(back);
  });
  it('hollows the caseback so the rotor never meets it, closed or lifting off', () => {
    const back = build().parts.caseback;
    const [inner, outer] = zRange(back);
    const rotor = caliber.parts.find((p) => p.id === 'rotor')!;
    const [rotorFront, rotorBack] = zRange(buildShape(rotor.shape, rotor.material as never), rotor.pos.z);
    const rotorRadius = rotor.shape.kind === 'rotor' ? rotor.shape.radius : NaN;
    // The pocket: the solid plate's inner face, and the rim's inner radius.
    const plate = back.find((l) => l.name === 'caseback-solid')!;
    const floor = zRange([plate])[0];
    const rim = back.find((l) => l !== plate)!;
    const pr = rim.geometry.getAttribute('position');
    let pocket = Infinity;
    for (let i = 0; i < pr.count; i++) pocket = Math.min(pocket, Math.hypot(pr.getX(i), pr.getY(i)));
    expect(rotorBack).toBeLessThan(floor);
    expect(rotorRadius).toBeLessThan(pocket);
    expect(outer - inner).toBeCloseTo(T.casebackThickness, 5);
    expect(closedAndOutward(rim.geometry).volume).toBeGreaterThan(0);
    expect(closedAndOutward(plate.geometry).volume).toBeGreaterThan(0);
    for (let t = 0; t <= openingDuration(); t += 0.01) {
      const p = openingPose(t);
      const lo = inner + p.casebackLift;
      // Wherever the rotor overlaps the back in depth, it must lie within the pocket, in front of the plate.
      if (rotorBack + p.rotorLift <= lo || rotorFront + p.rotorLift >= outer + p.casebackLift) continue;
      expect(rotorBack + p.rotorLift).toBeLessThan(floor + p.casebackLift);
      expect(p.rotorSlide + rotorRadius).toBeLessThan(pocket);
    }
  });
});
