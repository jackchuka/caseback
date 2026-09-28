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
// How far into the case a pusher's tube may run, pressed in: the case's reach less this.
const PUSHER_TUBE_DEPTH = 1.5;

// The generic case is checked around the default caliber; every watch around its own.
const builders: Array<[string, ExteriorBuilder, string]> = [
  ['generic', genericCase, 'eta-2824-2'],
  // And around a chronograph, for its pushers.
  ['generic chronograph', genericCase, 'valjoux-7750'],
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
        all = [...p.case, ...p.bezel, ...p.dial, ...p.crystal, ...p.strap, ...p.caseback, ...p.crown, ...p.hands.hour, ...p.hands.minute, ...p.hands.seconds, ...Object.values(p.hands.extra ?? {}).flat(), ...(p.pushers ?? []).flatMap((x) => x.layers)];
      });

      it('closes the case and caseback over the rotor', () => {
        const enclosure = Math.max(box(p.caseback).max.z, box(p.case).max.z);
        expect(enclosure - MOVEMENT_BACK).toBeGreaterThanOrEqual(0.05);
      });

      it('ends the casing ring at the case middle\'s back face', () => {
        expect(casingSpan(FRAME, b.anchors.caseBackZ).to).toBeLessThanOrEqual(b.anchors.caseBackZ + 1e-9);
        // The case middle's drum only: lugs, outside it in plan, may run on behind it, as the Presage's do.
        const all = vertices(p.case);
        const radius = Math.max(...all.filter((v) => Math.abs(v.y) < 1).map((v) => Math.abs(v.x)));
        expect(b.anchors.caseBackZ).toBeCloseTo(Math.max(...all.filter((v) => Math.hypot(v.x, v.y) <= radius).map((v) => v.z)), 0);
      });

      it('only a round caseback turns as it opens', () => {
        if (!b.anchors.casebackTurns) return;
        const r = vertices(p.caseback).map((v) => Math.hypot(v.x, v.y));
        const back = box(p.caseback);
        // A turn leaves a round back's footprint where it was; anything else would swing through the case.
        expect(Math.abs(back.max.x - back.min.x - (back.max.y - back.min.y))).toBeLessThan(0.5);
        expect(Math.max(...r)).toBeLessThan(Math.max(back.max.x, -back.min.x) + 0.5);
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

      it('replaces only the movement\'s own extra hands, each pointing to 12 within the dial', () => {
        const ids = new Set(FRAME.extraHands.map((h) => h.id));
        for (const [id, layers] of Object.entries(p.hands.extra ?? {})) {
          expect(ids.has(id), id).toBe(true);
          if (layers.length === 0) continue;
          const h = box(layers);
          expect(h.min.y, id).toBeLessThan(0);
          expect(h.max.y, id).toBeLessThan(-h.min.y);
        }
      });

      it('puts one pusher on each of the movement\'s pusher positions, outside the case', () => {
        const pushers = p.pushers ?? [];
        expect(pushers.map((x) => x.action).sort()).toEqual(FRAME.pushers.map((x) => x.action).sort());
        for (const ps of pushers) {
          const at = FRAME.pushers.find((f) => f.action === ps.action)!;
          const dir = { x: Math.cos(at.angle), y: Math.sin(at.angle) };
          // The case's reach along the pusher's direction, near its axis in plan, and a flank that spans the axis's height.
          const near = vertices(p.case).filter((v) => Math.abs(-v.x * dir.y + v.y * dir.x) < 0.5);
          const reach = Math.max(...near.map((v) => v.x * dir.x + v.y * dir.y));
          expect(Math.min(...near.map((v) => v.z))).toBeLessThan(at.z);
          expect(Math.max(...near.map((v) => v.z))).toBeGreaterThan(at.z);
          // Local +Y runs toward the case, so the inner end sits at radius − (its largest local y). At rest it reaches
          // the flank, so the pusher never floats off the case; pressed in, it sinks no deeper than its tube runs.
          const inner = ps.radius - Math.max(...vertices(ps.layers).map((v) => v.y));
          expect(inner, `${ps.action} reaches the flank`).toBeLessThanOrEqual(reach + 0.5);
          expect(inner - ps.travel, `${ps.action} stays in its tube`).toBeGreaterThan(reach - PUSHER_TUBE_DEPTH);
          expect(ps.travel, ps.action).toBeGreaterThan(0);
        }
      });

      it('every material key resolves', () => {
        const exterior = new Set([...Object.keys(b.materials), ...SHARED_EXTERIOR_MATERIALS, ...MOVEMENT_MATERIAL_KEYS]);
        const handsOnly = new Set(MOVEMENT_MATERIAL_KEYS);
        const outer = [...p.case, ...p.bezel, ...p.dial, ...p.crystal, ...p.strap, ...p.caseback, ...p.crown];
        expect(materialKeys(outer).filter((k) => !exterior.has(k))).toEqual([]);
        expect(materialKeys([...p.hands.hour, ...p.hands.minute, ...p.hands.seconds, ...Object.values(p.hands.extra ?? {}).flat()]).filter((k) => !handsOnly.has(k))).toEqual([]);
        expect(materialKeys((p.pushers ?? []).flatMap((x) => x.layers)).filter((k) => !exterior.has(k))).toEqual([]);
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
