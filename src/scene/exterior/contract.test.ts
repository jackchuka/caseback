import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../data/calibers';
import { watches } from '../../../data/watches';
import type { ExteriorBuilder, ExteriorLayer } from './contract';
import { movementFrame } from './frame';
import { genericCase } from './generic';
import { legacyRound } from './legacy';
import { MOVEMENT_MATERIAL_KEYS, SHARED_EXTERIOR_MATERIALS, materialKeys } from './materials';

const FRAME = movementFrame(calibers['eta-2824-2']!);
const ctx = { movement: FRAME, quality: 'low' as const };

const vertices = (layers: ExteriorLayer[]) =>
  layers.flatMap((l) => {
    const p = l.geometry.getAttribute('position');
    return Array.from({ length: p.count }, (_, i) => new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)));
  });
const box = (layers: ExteriorLayer[]) => new THREE.Box3().setFromPoints(vertices(layers));

const builders: Array<[string, ExteriorBuilder]> = [
  ['generic', genericCase],
  ...Object.values(watches).map((w): [string, ExteriorBuilder] => [w.id, legacyRound(w.exterior)]),
];

describe('exterior contract', () => {
  for (const [id, build] of builders) {
    const b = build(ctx);
    const p = b.parts;
    const all = [...p.case, ...p.bezel, ...p.dial, ...p.crystal, ...p.strap, ...p.caseback, ...p.crown, ...p.hands.hour, ...p.hands.minute, ...p.hands.seconds];

    it(`${id}: every vertex is finite`, () => {
      const bad = vertices(all).filter((v) => !Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z));
      expect(bad).toHaveLength(0);
    });

    it(`${id}: the dial sits inside the bore at the dial height`, () => {
      for (const v of vertices(p.dial)) {
        expect(Math.hypot(v.x, v.y)).toBeLessThanOrEqual(b.anchors.boreRadius + 1e-6);
        expect(Math.abs(v.z - FRAME.dialZ)).toBeLessThanOrEqual(0.5);
      }
    });

    it(`${id}: the crystal is wholly in front of the dial`, () => {
      if (p.crystal.length === 0 || p.dial.length === 0) return;
      expect(box(p.crystal).max.z).toBeLessThan(box(p.dial).min.z);
    });

    it(`${id}: the crown sits outside the case on the stem axis, beyond the stem end`, () => {
      const flank = vertices(p.case).filter((v) => Math.abs(v.y) < 0.5);
      expect(b.anchors.crownX).toBeGreaterThan(Math.max(...flank.map((v) => v.x)));
      expect(b.anchors.crownX).toBeGreaterThanOrEqual(FRAME.stemEnd!);
    });

    it(`${id}: hour and minute hands point to 12 and fit the bore`, () => {
      for (const hand of [p.hands.hour, p.hands.minute]) {
        if (hand.length === 0) continue;
        const h = box(hand);
        expect(h.min.y).toBeLessThan(0);
        expect(-h.min.y).toBeLessThan(b.anchors.boreRadius);
        expect(h.max.y).toBeLessThan(-h.min.y);
      }
    });

    it(`${id}: every material key resolves`, () => {
      const exterior = new Set([...Object.keys(b.materials), ...SHARED_EXTERIOR_MATERIALS, ...MOVEMENT_MATERIAL_KEYS]);
      const handsOnly = new Set(MOVEMENT_MATERIAL_KEYS);
      const outer = [...p.case, ...p.bezel, ...p.dial, ...p.crystal, ...p.strap, ...p.caseback, ...p.crown];
      expect(materialKeys(outer).filter((k) => !exterior.has(k))).toEqual([]);
      expect(materialKeys([...p.hands.hour, ...p.hands.minute, ...p.hands.seconds]).filter((k) => !handsOnly.has(k))).toEqual([]);
    });
  }
});
