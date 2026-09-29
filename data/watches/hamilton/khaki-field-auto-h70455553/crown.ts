import * as THREE from 'three';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { cutFlutes } from '../../../../src/scene/exterior/kit/flutes';
import { H } from './params';

// Coarse knurling: about 20 ridges round the crown on the front photo and gnomon-5.
export const CROWN_FLUTES = 20;

// Distance of the crown's centre from the watch centre along the stem: past the case wall and the neck.
export const crownRadius = () => H.caseRadius + H.neckLength + H.crownLength / 2;

// The push-pull crown: a flat end face inside a polished bevel (its engraved logo left off), a deeply knurled grip,
// and a short neck into the case. Local axis Y, +Y toward the case.
export function hamiltonCrown(): ExteriorLayer[] {
  const rad = H.crownDiameter / 2;
  const L = H.crownLength;
  const out = -L / 2, neck = L / 2;
  // A smooth end band about a quarter of the crown's length, then the knurl right up to the case.
  const grip: [number, number] = [out + 0.9, neck - 0.15];
  const steps = 8;
  const wall: Array<[number, number]> = Array.from({ length: steps + 1 }, (_, i) => [rad, grip[0] + (i * (grip[1] - grip[0])) / steps]);
  // End face: a flat disc inside a rounded polished edge (0.9 → 0.1 mm in from the rim over the first 0.8 mm), as on
  // the front photo; the neck end steps in 0.25 mm to meet the tube.
  const body = new THREE.LatheGeometry(
    ([[0, out], [rad - 0.9, out], [rad - 0.35, out + 0.2], [rad - 0.12, out + 0.5], [rad - 0.1, grip[0] - 0.1], ...wall, [rad - 0.25, neck], [0, neck]] as Array<[number, number]>).map(([x, y]) => new THREE.Vector2(x, y)),
    CROWN_FLUTES * 8,
  );
  cutFlutes(body, { axis: 'y', radius: rad, count: CROWN_FLUTES, depth: 0.28, from: grip[0], to: grip[1] });
  const neckLen = H.neckLength + 0.3;
  const tube = new THREE.CylinderGeometry(H.neckDiameter / 2, H.neckDiameter / 2, neckLen, 48).translate(0, neck + neckLen / 2, 0);
  return [{ geometry: body, material: 'polished' }, { geometry: tube, material: 'steel' }];
}
