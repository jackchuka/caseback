import type * as THREE from 'three';
import type { MovementMaterial } from '../../geometry/parts';
import type { PusherAction } from '../../model/schema';

// Every builder behind this contract must hold to:
// - the case is centred on the movement;
// - the dial faces −Z;
// - the crown sits on the stem axis, its local frame origin at its centre, +Y toward the case;
// - a material key resolves own materials, then shared exterior materials (caseback-engraving,
//   caseback-glass), then movement materials, in that order; an unknown key throws;
// - hands use movement materials only, never the build's own;
// - every instantiated crystal material is transparent;
// - own materials named after the movement's calendar discs (DISC_MATERIALS: date, day) take precedence over the
//   movement's own for those discs, so a watch can show white-on-black dates; they must be MeshPhysicalMaterials;
// - a centre seconds hand goes in hands.seconds; hands.extra is for the movement's other hand parts (a small seconds,
//   a chronograph's hands), which MovementFrame.extraHands lists;
// - the caseback is placed at its closed position; the opening animation only adds lift, and turn if it screws down;
// - a new builder adds its own closed-case mesh test.

// A hand layer replaces one of the movement's own hands, so it may only use a movement material.
export type HandLayer = { geometry: THREE.BufferGeometry; material: MovementMaterial };

// Movement-side facts every exterior builds around, derived once from the caliber.
export type MovementFrame = {
  diameterMm: number;
  frontZ: number;
  dialZ: number;
  secondsZ: number;
  stemZ: number;
  stemEnd: number | null;
  stemRadius: number;
  dateWindow: { x: number; width: number; height: number } | null;
  // A day window beside the date, over the day ring's names at 3 o'clock.
  dayWindow: { x: number; width: number; height: number } | null;
  plateFrontZ: number;
  rotorBackZ: number;
  // Hands the movement carries besides the hour and minute hands and a centre seconds (a small seconds, a
  // chronograph's hands): the movement part each belongs to and its pivot.
  extraHands: Array<{ id: string; x: number; y: number; z: number }>;
  // Chronograph pushers: where each one meets the case flank, as an angle from 3 o'clock toward 6 (radians), and the
  // height of its axis.
  pushers: Array<{ action: PusherAction; angle: number; z: number }>;
};

export type { PusherAction };

export type ExteriorContext = { movement: MovementFrame; quality: 'high' | 'low' };

// `material` is a key into the build's own materials, the shared exterior materials, or the movement materials; an
// array maps onto the geometry's groups. `name` overrides the mesh name the part would otherwise get. `castShadow`
// defaults to true.
export type ExteriorLayer = { geometry: THREE.BufferGeometry; material: string | string[]; name?: string; castShadow?: boolean };

// Geometry only, so a worker can build it and hand it over; materials stay on the main thread with their canvases.
export type ExteriorGeometry = {
  parts: {
    case: ExteriorLayer[];
    bezel: ExteriorLayer[];
    dial: ExteriorLayer[];
    crystal: ExteriorLayer[];
    strap: ExteriorLayer[];
    // Placed at its closed position; the opening animation only adds lift, and turn when anchors.casebackTurns.
    caseback: ExteriorLayer[];
    // Local frame: origin at the crown's centre, +Y toward the case.
    crown: ExteriorLayer[];
    // Pivot at the origin, 12 o'clock toward −Y. Movement materials only: they replace the movement's own hands.
    // `extra` replaces the movement's other hands, keyed by their part ids in MovementFrame.extraHands.
    hands: { hour: HandLayer[]; minute: HandLayer[]; seconds: HandLayer[]; extra?: Record<string, HandLayer[]> };
    // One per MovementFrame pusher. Local frame: axis Y, +Y toward the case, origin at the pusher's centre, which
    // sits `radius` from the watch centre; a push moves it `travel` toward the case.
    pushers?: Array<{ action: PusherAction; radius: number; travel: number; layers: ExteriorLayer[] }>;
  };
  // seatRadius: the round movement seat's radius, which drives the casing ring in Exterior.tsx. caseBackZ: the case
  // middle's back face (the caseback's seat), where the casing ring must stop. casebackTurns: a screw-down back
  // unscrews as it lifts; a back held by screws (any non-round one) lifts straight off.
  anchors: { seatRadius: number; crownX: number; caseBackZ: number; casebackTurns: boolean };
};

export const DISC_MATERIALS = ['date', 'day'] as const;

// Built lazily so geometry tests never touch a canvas.
export type DiscMaterial = (typeof DISC_MATERIALS)[number];
export type ExteriorMaterials = Record<string, () => THREE.Material> & Partial<Record<DiscMaterial, () => THREE.MeshPhysicalMaterial>>;

export type ExteriorBuild = ExteriorGeometry & { materials: ExteriorMaterials };

export type ExteriorBuilder = { geometry: (ctx: ExteriorContext) => ExteriorGeometry; materials: () => ExteriorMaterials };

export const buildExterior = (b: ExteriorBuilder, ctx: ExteriorContext): ExteriorBuild => ({ ...b.geometry(ctx), materials: b.materials() });
