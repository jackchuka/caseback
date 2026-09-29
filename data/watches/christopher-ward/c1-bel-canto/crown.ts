import * as THREE from 'three';
import type { ExteriorLayer, PusherAction } from '../../../../src/scene/exterior/contract';
import { cutFlutes } from '../../../../src/scene/exterior/kit/flutes';
import { P } from './params';

const C = P.crown;
// Broad, flat-topped block flutes, like a gear's teeth, with chamfered ends.
export const CROWN_FLUTES = C.flutes;

// Distance of the crown's centre from the watch centre along the stem: past the case flank and the neck.
export const crownRadius = () => P.caseRadius + C.neck + C.length / 2;

// The push-pull crown (not screw-down: the case is rated to 3 ATM): a flat end face inside a polished bevel (its
// engraved logo left off), deep block flutes almost to the case, and a short tube into the case. Local axis Y, +Y
// toward the case.
export function belCantoCrown(): ExteriorLayer[] {
  const rad = C.diameter / 2;
  const L = C.length;
  const out = -L / 2, neck = L / 2;
  const grip: [number, number] = [out + 0.45, neck - 0.2];
  const steps = 8;
  const wall: Array<[number, number]> = Array.from({ length: steps + 1 }, (_, i) => [rad, grip[0] + (i * (grip[1] - grip[0])) / steps]);
  const body = new THREE.LatheGeometry(
    ([[0, out], [rad - 0.7, out], [rad - 0.3, out + 0.12], [rad - 0.08, out + 0.3], ...wall, [rad - 0.3, neck], [0, neck]] as Array<[number, number]>).map(([x, y]) => new THREE.Vector2(x, y)),
    CROWN_FLUTES * 8,
  );
  cutFlutes(body, { axis: 'y', radius: rad, count: CROWN_FLUTES, depth: 0.4, from: grip[0], to: grip[1] });
  const tubeLength = C.neck + 0.6;
  const tube = new THREE.CylinderGeometry(1.3, 1.3, tubeLength, 48).translate(0, neck + tubeLength / 2, 0);
  return [{ geometry: body, material: 'polished' }, { geometry: tube, material: 'polished' }];
}

const U = P.pusher;
// The pusher's centre, halfway along it from where it enters the case band to its end face.
export const pusherRadius = () => (U.inner + U.end) / 2;

// A box whose outer end (−Y) is scaled down to `endScale` across and through: a frustum with flat facets.
function block(width: number, height: number, from: number, to: number, endScale: [number, number] = [1, 1]) {
  const g = new THREE.BoxGeometry(width, to - from, height).translate(0, (from + to) / 2, 0);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) if (Math.abs(p.getY(i) - from) < 1e-5) p.setXYZ(i, p.getX(i) * endScale[0], from, p.getZ(i) * endScale[1]);
  g.computeVertexNormals();
  return g;
}

// The chime pusher: a brushed block standing out of the case band, its polished tip faceted down to a narrower end
// face. Local axis Y, +Y toward the case, X across the flank, origin at the pusher's centre.
function pusher(): ExteriorLayer[] {
  const r = pusherRadius();
  // Local y of a radius from the watch centre.
  const y = (radius: number) => r - radius;
  const body = block(U.width, U.height, y(U.tipFrom), y(U.inner));
  const tip = block(U.width, U.height, y(U.end), y(U.tipFrom), [U.endWidth / U.width, U.endHeight / U.height]);
  return [{ geometry: body, material: 'case' }, { geometry: tip, material: 'polished' }];
}

export function belCantoPushers(): Array<{ action: PusherAction; radius: number; travel: number; layers: ExteriorLayer[] }> {
  return [{ action: 'chime', radius: pusherRadius(), travel: U.travel, layers: pusher() }];
}
