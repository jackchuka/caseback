import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../data/calibers';
import { watches } from '../../../data/watches';
import { buildExterior, type ExteriorBuild, type ExteriorBuilder, type ExteriorLayer } from './contract';
import { movementFrame } from './frame';
import { genericCase } from './generic';
import { buildShape } from '../../geometry/parts';
import { casingSpan } from '../caseGeometry';
import { MOVEMENT_MATERIAL_KEYS, SHARED_EXTERIOR_MATERIALS, materialKeys } from './materials';

// The deepest point any back-side movement part actually renders to (pins, bosses and bevels included), not its nominal size.
const movementBack = (caliberId: string) =>
  Math.max(
    ...calibers[caliberId]!.parts
      .filter((p) => p.side === 'back')
      .flatMap((p) => buildShape(p.shape, p.material).map((l) => { l.geometry.computeBoundingBox(); return l.geometry.boundingBox!.max.z + p.pos.z; })),
  );

const vertices = (layers: ExteriorLayer[]) =>
  layers.flatMap((l) => {
    const p = l.geometry.getAttribute('position');
    return Array.from({ length: p.count }, (_, i) => new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)));
  });
const box = (layers: ExteriorLayer[]) => new THREE.Box3().setFromPoints(vertices(layers));

// The generic case is checked around the default caliber; every watch around its own.
const builders: Array<[string, ExteriorBuilder, string]> = [
  ['generic', genericCase, 'eta-2824-2'],
  ...Object.values(watches).map((w): [string, ExteriorBuilder, string] => [w.id, w.exterior, w.caliberId]),
];

describe('exterior contract', () => {
  for (const [id, builder, caliberId] of builders) {
    describe(id, () => {
      const FRAME = movementFrame(calibers[caliberId]!);
      const MOVEMENT_BACK = movementBack(caliberId);
      const ctx = { movement: FRAME, quality: 'low' as const };
      // Built once per builder (not at describe time) so a throwing builder fails only its own tests, under its id.
      let b: ExteriorBuild;
      let p: ExteriorBuild['parts'];
      let all: ExteriorLayer[];

      beforeAll(() => {
        b = buildExterior(builder, ctx);
        p = b.parts;
        all = [...p.case, ...p.bezel, ...p.dial, ...p.crystal, ...p.strap, ...p.caseback, ...p.crown, ...p.hands.hour, ...p.hands.minute, ...p.hands.seconds];
      });

      it('closes the case and caseback over the rotor', () => {
        const enclosure = Math.max(box(p.caseback).max.z, box(p.case).max.z);
        expect(enclosure - MOVEMENT_BACK).toBeGreaterThanOrEqual(0.05);
      });

      it('ends the casing ring at the case middle\'s back face', () => {
        expect(casingSpan(FRAME, b.anchors.caseBackZ).to).toBeLessThanOrEqual(b.anchors.caseBackZ + 1e-9);
        // Around the movement seat: lugs may run on behind the case middle, as the Presage's do.
        const seat = vertices(p.case).filter((v) => Math.hypot(v.x, v.y) < b.anchors.seatRadius + 1);
        expect(b.anchors.caseBackZ).toBeCloseTo(Math.max(...seat.map((v) => v.z)), 0);
      });

      it('every vertex is finite', () => {
        const bad = vertices(all).filter((v) => !Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z));
        expect(bad).toHaveLength(0);
      });

      it('the dial sits inside the case footprint at the dial height', () => {
        const caseBox = box(p.case);
        for (const v of vertices(p.dial)) {
          expect(v.x).toBeGreaterThanOrEqual(caseBox.min.x - 1e-6);
          expect(v.x).toBeLessThanOrEqual(caseBox.max.x + 1e-6);
          expect(v.y).toBeGreaterThanOrEqual(caseBox.min.y - 1e-6);
          expect(v.y).toBeLessThanOrEqual(caseBox.max.y + 1e-6);
          expect(Math.abs(v.z - FRAME.dialZ)).toBeLessThanOrEqual(0.5);
        }
      });

      it('the crystal is wholly in front of the dial', () => {
        if (p.crystal.length === 0 || p.dial.length === 0) return;
        expect(box(p.crystal).max.z).toBeLessThan(box(p.dial).min.z);
      });

      it('the crown sits outside the case on the stem axis, beyond the stem end', () => {
        const flank = vertices(p.case).filter((v) => Math.abs(v.y) < 0.5);
        expect(b.anchors.crownX).toBeGreaterThan(Math.max(...flank.map((v) => v.x)));
        expect(b.anchors.crownX).toBeGreaterThanOrEqual(FRAME.stemEnd!);
      });

      it('hour and minute hands point to 12 and fit within the dial', () => {
        // With a dial, hands must clear its edge, not just the movement seat; without one (the generic case) fall
        // back to the seat radius.
        const dialLimit = p.dial.length > 0 ? Math.max(...vertices(p.dial).map((v) => Math.hypot(v.x, v.y))) : b.anchors.seatRadius;
        for (const hand of [p.hands.hour, p.hands.minute]) {
          if (hand.length === 0) continue;
          const h = box(hand);
          expect(h.min.y).toBeLessThan(0);
          expect(-h.min.y).toBeLessThan(dialLimit);
          expect(h.max.y).toBeLessThan(-h.min.y);
        }
      });

      it('every material key resolves', () => {
        const exterior = new Set([...Object.keys(b.materials), ...SHARED_EXTERIOR_MATERIALS, ...MOVEMENT_MATERIAL_KEYS]);
        const handsOnly = new Set(MOVEMENT_MATERIAL_KEYS);
        const outer = [...p.case, ...p.bezel, ...p.dial, ...p.crystal, ...p.strap, ...p.caseback, ...p.crown];
        expect(materialKeys(outer).filter((k) => !exterior.has(k))).toEqual([]);
        expect(materialKeys([...p.hands.hour, ...p.hands.minute, ...p.hands.seconds]).filter((k) => !handsOnly.has(k))).toEqual([]);
      });

      it('crystal materials come from the build\'s own materials and are transparent', () => {
        const own = new Set(Object.keys(b.materials));
        const keys = materialKeys(p.crystal);
        expect(keys.filter((k) => !own.has(k))).toEqual([]);
        // Only instantiate the crystal's own materials: other own materials may depend on canvas-only textures.
        for (const k of keys) expect(b.materials[k]!().transparent).toBe(true);
      });
    });
  }
});
