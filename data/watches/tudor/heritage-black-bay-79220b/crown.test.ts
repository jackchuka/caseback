import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { crownX, tudorCrown } from './crown';
import { calibers } from '../../../calibers';
import { buildShape } from '../../../../src/geometry/parts';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { bezelTop } from './bezel';
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
  it('sits lower on the flank than the movement front alone would put it, no higher than the bezel top', () => {
    expect(m.stemZ - caseFront(m)).toBeCloseTo(T.caseFrontOffset + (m.stemZ - m.frontZ), 5);
    expect(m.stemZ - caseFront(m)).toBeGreaterThan(2.2);
    expect(m.stemZ - T.crownDiameter / 2).toBeGreaterThanOrEqual(bezelTop(m) - 0.05);
  });
  it('keeps the watch 13 mm thick with the rotor inside the case', () => {
    const build = tudor79220b({ movement: m, quality: 'low' });
    const front = zRange(tudorCrystal(m))[0];
    const back = zRange(build.parts.caseback)[1];
    expect(back - front).toBeCloseTo(T.totalThickness, 0);
    expect(Math.abs(back - front - T.totalThickness)).toBeLessThanOrEqual(0.3);
    const rotor = caliber.parts.find((p) => p.id === 'rotor')!;
    const rotorBack = zRange(buildShape(rotor.shape, rotor.material as never), rotor.pos.z)[1];
    expect(caseShape(m).back).toBeGreaterThanOrEqual(rotorBack - 0.01);
  });
});
