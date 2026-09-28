import * as THREE from 'three';
import type { ExteriorLayer } from '../contract';
import { cutFlutes, fluteCount } from './flutes';

export type CrownSpec = {
  diameter: number; length: number; fluteDepth: number;
  tube: { diameter: number; length: number };
  // The end face: how far its flat part stops short of the grip, over what axial run the edge rounds in, and how far
  // its centre domes outward (0 for a flat face).
  end?: { inset: number; run: number; dome: number };
  // Where the grip ends: its distance from the end face and from the neck, and the neck's step in.
  grip?: { fromEnd: number; fromNeck: number; neckStep: number };
  material?: string; tubeMaterial?: string;
};

// A turned crown with a fluted grip and a tube toward the case. Local axis Y, +Y toward the case, origin at its centre.
export function flutedCrown(s: CrownSpec): ExteriorLayer[] {
  const rad = s.diameter / 2;
  const L = s.length;
  const out = -L / 2, neck = L / 2;
  const end = s.end ?? { inset: 0.35, run: 0.25, dome: 0 };
  const g = s.grip ?? { fromEnd: 0.3, fromNeck: 0.35, neckStep: 0.3 };
  const grip: [number, number] = [out + g.fromEnd, neck - g.fromNeck];
  // The grip wall needs its own axial subdivisions (a straight profile line carries no interior vertices), so the
  // flutes actually cut the mid-grip surface rather than only its two end rings.
  const gripSteps = 8;
  const gripWall: Array<[number, number]> = Array.from({ length: gripSteps + 1 }, (_, i) => [rad, grip[0] + (i * (grip[1] - grip[0])) / gripSteps]);
  const face: Array<[number, number]> = end.dome > 0
    ? Array.from({ length: 9 }, (_, i): [number, number] => {
      const r = ((rad - end.inset) * i) / 8;
      return [r, out - end.dome * (1 - (r / (rad - end.inset)) ** 2)];
    })
    : [[0, out], [rad - end.inset, out]];
  const body = new THREE.LatheGeometry(
    ([...face, [rad, out + end.run], ...gripWall, [rad - g.neckStep, neck], [0, neck]] as Array<[number, number]>).map(([x, y]) => new THREE.Vector2(x, y)),
    fluteCount(s.diameter) * 4,
  );
  cutFlutes(body, { axis: 'y', radius: rad, count: fluteCount(s.diameter), depth: s.fluteDepth, from: grip[0], to: grip[1] });
  const tl = s.tube.length + 0.3;
  const tube = new THREE.CylinderGeometry(s.tube.diameter / 2, s.tube.diameter / 2, tl, 48).translate(0, neck + tl / 2, 0);
  return [{ geometry: body, material: s.material ?? 'polished' }, { geometry: tube, material: s.tubeMaterial ?? 'steel' }];
}
