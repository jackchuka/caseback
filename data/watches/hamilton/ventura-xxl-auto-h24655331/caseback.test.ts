import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { casebackOuter, venturaCaseback } from './caseback';
import { caseBack } from './case';
import { V } from './params';
import { casebackPlan, planFields } from './plan';

describe('Ventura display back', () => {
  const layers = venturaCaseback();
  const plan = casebackPlan();
  it('is a plate stepped in from the main tier, covering the round seat', () => {
    const { tiers } = planFields();
    for (const [x, y] of [[0, -18], [-17, 0], [18, 3]] as const) expect(plan.plate(x, y) - tiers[0]!(x, y)).toBeCloseTo(V.caseback.inset, 5);
    for (let a = 0; a < 360; a += 5) {
      const t = (a * Math.PI) / 180;
      expect(plan.plate(Math.cos(t) * V.seat, Math.sin(t) * V.seat)).toBeLessThan(-0.5);
    }
  });
  it('frames the window widest on the crown side and notches it below 3 o\'clock', () => {
    expect(plan.window(0, 0)).toBeLessThan(0);
    expect(plan.window(V.caseback.crownSide + 0.2, -0.5)).toBeGreaterThan(0);
    expect(plan.window(V.caseback.crownSide - 0.5, -0.5)).toBeLessThan(0);
    expect(plan.window(V.caseback.notch.x + 0.5, V.caseback.notch.y + 1)).toBeGreaterThan(0);
  });
  it('shows the movement through glass named for the hit test, set back from the outer face', () => {
    const glass = layers.find((l) => l.name === 'caseback-glass')!;
    expect(glass.material).toBe('caseback-glass');
    glass.geometry.computeBoundingBox();
    expect(glass.geometry.boundingBox!.max.z).toBeCloseTo(casebackOuter() - V.caseback.recess, 5);
  });
  it('seats on the case back and is held by three screws at its corners', () => {
    const plate = layers.find((l) => l.name === 'caseback-plate')!.geometry;
    plate.computeBoundingBox();
    expect(plate.boundingBox!.min.z).toBeCloseTo(caseBack(), 5);
    expect(plate.boundingBox!.max.z).toBeCloseTo(casebackOuter(), 5);
    const screws = layers.filter((l) => l.name === 'caseback-screw');
    expect(screws).toHaveLength(V.caseback.screws);
    for (const s of screws) {
      s.geometry.computeBoundingBox();
      const c = s.geometry.boundingBox!.getCenter(new THREE.Vector3());
      expect(plan.plate(c.x, c.y)).toBeLessThan(-V.caseback.screwRadius);
      expect(plan.window(c.x, c.y)).toBeGreaterThan(V.caseback.screwRadius);
    }
  });
  it('builds plain, non-interleaved attributes a worker can transfer', () => {
    for (const l of layers) expect(l.geometry.getAttribute('position')).toBeInstanceOf(THREE.BufferAttribute);
  });
});
