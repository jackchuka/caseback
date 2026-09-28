import type * as THREE from 'three';
import type { Layer } from '../../geometry/parts';

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
};

export type ExteriorContext = { movement: MovementFrame; quality: 'high' | 'low' };

// `material` is a key into the build's own materials, the shared exterior materials, or the movement materials; an
// array maps onto the geometry's groups. `name` overrides the mesh name the part would otherwise get.
export type ExteriorLayer = { geometry: THREE.BufferGeometry; material: string | string[]; name?: string };

export type ExteriorBuild = {
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
    hands: { hour: Layer[]; minute: Layer[]; seconds: Layer[] };
  };
  // Built lazily so geometry tests never touch a canvas.
  materials: Record<string, () => THREE.Material>;
  anchors: { boreRadius: number; crownX: number };
};

export type ExteriorBuilder = (ctx: ExteriorContext) => ExteriorBuild;
