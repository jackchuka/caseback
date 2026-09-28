import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../../data/calibers';
import { legacyConfigs } from './configs';
import { DIVER } from './fixtures';
import { movementFrame } from '../frame';
import { caseRadii } from './radii';
import { caseBody, caseShape, springBar } from './caseBody';
import { closedAndOutward } from '../kit/meshCheck';

const FRAME = movementFrame(calibers['eta-2824-2']!);

describe('one-piece case middle', () => {
  for (const [id, e] of Object.entries(legacyConfigs)) {
    const r = caseRadii(FRAME, e);
    const s = caseShape(e, r);
    const lw = e.case.lugWidthMm / 2;
    const W = e.case.lugs.widthMm;
    const tip = e.case.lugToLugMm / 2;
    const layers = caseBody(e, r, 0.3);
    const box = new THREE.Box3();
    for (const l of layers) { l.geometry.computeBoundingBox(); box.union(l.geometry.boundingBox!); }

    it(`${id}: matches the real diameter and lug-to-lug`, () => {
      expect(box.max.y - box.min.y).toBeCloseTo(e.case.lugToLugMm, 0);
      expect(box.max.x - box.min.x).toBeCloseTo(e.case.diameterMm, 0);
    });

    it(`${id}: leaves exactly the lug width free for the strap`, () => {
      // Away from the spring-bar hole.
      const y = tip - 4;
      const z = s.midZ(lw + W / 2, y);
      expect(s.sdf(lw - 0.25, y, z)).toBeGreaterThan(0);
      expect(s.sdf(lw + 0.25, y, z)).toBeLessThan(0);
    });

    it(`${id}: blends each lug into the round case with a concave fillet, not a sharp corner`, () => {
      const x = lw + W + 0.4;
      const y = Math.sqrt(r.outer ** 2 - x ** 2) + 0.4;
      expect(s.sdf(x, y, s.midZ(x, y))).toBeLessThan(0);
    });

    it(`${id}: keeps the case front flat and sweeps the lug tips toward the wrist`, () => {
      expect(s.front(0, r.outer - 1)).toBeCloseTo(r.bottom, 5);
      expect(s.front(lw + W / 2, tip) - r.bottom).toBeGreaterThan(0.35 * r.height);
    });

    it(`${id}: is one closed, outward-facing surface`, () => {
      expect(layers).toHaveLength(1);
      const { open, volume } = closedAndOutward(layers[0]!.geometry);
      expect(open).toBe(0);
      expect(volume).toBeGreaterThan(0);
    });

    it(`${id}: polishes the bevel and finishes top and flank as specified`, () => {
      const z = r.bottom + e.case.chamferMm / 2;
      // Middle of the bevel at 9 o'clock, the top face just inside it, and the flank below.
      expect(s.polish(-(r.outer - e.case.chamferMm / 2), 0, z)).toBeGreaterThan(0.9);
      expect(s.polish(-(r.outer - e.case.chamferMm - 0.6), 0, r.bottom)).toBeCloseTo(e.case.finish.top === 'polished' ? 1 : 0, 1);
      expect(s.polish(-r.outer, 0, r.bottom + r.height / 2)).toBeCloseTo(e.case.finish.flank === 'polished' ? 1 : 0, 1);
    });

    it(`${id}: ${e.case.lugs.drilled ? 'drills' : 'does not drill'} through the lugs`, () => {
      const b = springBar(e, r);
      const through = s.sdf(lw + W * 0.5, b.y, b.z) > 0;
      expect(through).toBe(e.case.lugs.drilled);
    });
  }
});

describe('crown guards', () => {
  const base = DIVER;
  const guarded = { ...base, crown: { ...base.crown, guards: true } };
  const r = caseRadii(FRAME, guarded);
  const cr = guarded.crown.diameterMm / 2;
  it('grows two shoulders out of the case beside the crown, leaving the crown free', () => {
    const s = caseShape(guarded, r);
    const x = r.outer + guarded.crown.lengthMm * 0.4;
    const z = s.midZ(x, 0);
    expect(s.sdf(x, cr + 1.5, z)).toBeLessThan(0);
    expect(s.sdf(x, -(cr + 1.5), z)).toBeLessThan(0);
    expect(s.sdf(x, 0, z)).toBeGreaterThan(0);
    // Only at 3 o'clock.
    expect(s.sdf(-x, cr + 1.5, z)).toBeGreaterThan(0);
  });
  it('keeps the guards at full case height rather than sweeping down like lugs', () => {
    const s = caseShape(guarded, r);
    expect(s.front(r.outer + 1, cr + 1.5)).toBeCloseTo(r.bottom, 5);
  });
  it('stays one closed surface with the guards fused on', () => {
    const { open, volume } = closedAndOutward(caseBody(guarded, r, 0.3)[0]!.geometry);
    expect(open).toBe(0);
    expect(volume).toBeGreaterThan(0);
  });
  it('adds nothing when a watch has no guards', () => {
    const s = caseShape(base, r);
    const x = r.outer + base.crown.lengthMm * 0.4;
    expect(s.sdf(x, cr + 1.5, s.midZ(x, 0))).toBeGreaterThan(0);
  });
});
