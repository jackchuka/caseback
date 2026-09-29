import * as THREE from 'three';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { flutedCrown } from '../../../../src/scene/exterior/kit/crown';
import { cutFlutes, fluteCount } from '../../../../src/scene/exterior/kit/flutes';
import type { PusherAction } from '../../../../src/scene/exterior/contract';
import { P } from './params';

// The crown's inner end sits just clear of the guards' notch floor (the drum).
const NOTCH_CLEARANCE = 0.4;

// Distance of the crown's centre from the watch centre along the stem.
export const crownRadius = () => P.caseRadius + NOTCH_CLEARANCE + P.crownLength / 2;

// A screw-down crown: coin-edge flutes along its side and a domed end (its engraved logo is left off).
export function sinnCrown(): ExteriorLayer[] {
  return flutedCrown({
    diameter: P.crownDiameter, length: P.crownLength, fluteDepth: 0.2,
    tube: { diameter: P.tubeDiameter, length: NOTCH_CLEARANCE },
    end: { inset: 0.9, run: 0.6, dome: P.crownDome }, grip: { fromEnd: 0.7, fromNeck: 0.25, neckStep: 0.35 },
    material: 'polished',
  });
}

const U = P.pusher;
// Each pusher's centre (the middle of its fluted collar), from the watch centre along its axis.
export const pusherRadius = () => U.seat + 0.3 + U.collarLength / 2;

// A pusher: a fluted collar, a smooth domed button on its outer end, and the tube it runs in back into the case.
// Local axis Y, +Y toward the case, origin at the collar's centre.
function pusher(): ExteriorLayer[] {
  const r = U.collarDiameter / 2, h = U.collarLength / 2;
  // Rings along the wall, so the flutes have vertices to cut.
  const wall = Array.from({ length: 7 }, (_, i) => [r, -h + 0.3 + ((2 * h - 0.55) * i) / 6]);
  const collar = new THREE.LatheGeometry([[0, -h], [r - 0.3, -h], [r, -h + 0.25], ...wall, [r, h - 0.2], [r - 0.3, h], [0, h]].map(([x, y]) => new THREE.Vector2(x, y)), fluteCount(U.collarDiameter) * 4);
  cutFlutes(collar, { axis: 'y', radius: r, count: fluteCount(U.collarDiameter), depth: 0.2, from: -h + 0.3, to: h - 0.25 });
  const b = U.buttonDiameter / 2, out = -h - U.buttonLength;
  const button = new THREE.LatheGeometry(
    [[0, out - 0.25], [b * 0.6, out - 0.18], [b - 0.2, out], [b, out + 0.25], [b, -h + 0.05], [0, -h + 0.05]].map(([x, y]) => new THREE.Vector2(x, y)),
    64,
  );
  const tubeLength = pusherRadius() - h - (P.caseRadius - 0.6);
  const tube = new THREE.CylinderGeometry(U.tubeDiameter / 2, U.tubeDiameter / 2, tubeLength, 40).translate(0, h + tubeLength / 2, 0);
  return [
    { geometry: collar, material: 'polished' },
    { geometry: button, material: 'polished' },
    { geometry: tube, material: 'polished' },
  ];
}

export function sinnPushers(): Array<{ action: PusherAction; radius: number; travel: number; layers: ExteriorLayer[] }> {
  return (['start-stop', 'reset'] as const).map((action) => ({ action, radius: pusherRadius(), travel: U.travel, layers: pusher() }));
}
