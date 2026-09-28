import type * as THREE from 'three';
import type { MovementMaterial } from '../../geometry/parts';

// Every builder behind this contract must hold to:
// - the case is centred on the movement;
// - the dial faces −Z;
// - the crown sits on the stem axis, its local frame origin at its centre, +Y toward the case;
// - a material key resolves own materials, then shared exterior materials (caseback-engraving,
//   caseback-glass), then movement materials, in that order; an unknown key throws;
// - hands use movement materials only, never the build's own;
// - every instantiated crystal material is transparent;
// - the caseback is placed at its closed position; the opening animation only adds lift and turn;
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
  plateFrontZ: number;
  rotorBackZ: number;
};

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
    // Placed at its closed position; the opening animation only adds lift and turn.
    caseback: ExteriorLayer[];
    // Local frame: origin at the crown's centre, +Y toward the case.
    crown: ExteriorLayer[];
    // Pivot at the origin, 12 o'clock toward −Y. Movement materials only: they replace the movement's own hands.
    hands: { hour: HandLayer[]; minute: HandLayer[]; seconds: HandLayer[] };
  };
  // seatRadius: the round movement seat's radius, which drives the casing ring in Exterior.tsx. caseBackZ: the case
  // middle's back face (the caseback's seat), where the casing ring must stop.
  anchors: { seatRadius: number; crownX: number; caseBackZ: number };
};

// Built lazily so geometry tests never touch a canvas.
export type ExteriorMaterials = Record<string, () => THREE.Material>;

export type ExteriorBuild = ExteriorGeometry & { materials: ExteriorMaterials };

export type ExteriorBuilder = { geometry: (ctx: ExteriorContext) => ExteriorGeometry; materials: () => ExteriorMaterials };

export const buildExterior = (b: ExteriorBuilder, ctx: ExteriorContext): ExteriorBuild => ({ ...b.geometry(ctx), materials: b.materials() });
