import * as THREE from 'three';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { cutFlutes } from '../../../../src/scene/exterior/kit/flutes';
import { P } from './params';

// Distance of the crown's centre from the watch centre along the stem: past the case wall and the exposed tube.
export const crownRadius = () => P.caseRadius + P.tubeLength + P.crownLength / 2 - 0.1;

// The large push-in crown: a slightly domed end face (its engraved "S" is left off), a band of coarse rounded
// scallops, and a short tube into the case. Local axis Y, +Y toward the case.
export function presageCrown(): ExteriorLayer[] {
  const rad = P.crownDiameter / 2;
  const L = P.crownLength;
  const out = -L / 2, neck = L / 2;
  const grip: [number, number] = [out + 0.35, neck - 0.3];
  const steps = 8;
  const wall: Array<[number, number]> = Array.from({ length: steps + 1 }, (_, i) => [rad, grip[0] + (i * (grip[1] - grip[0])) / steps]);
  const profile: Array<[number, number]> = [[0, out - 0.12], [rad * 0.55, out - 0.08], [rad - 0.45, out], [rad - 0.1, out + 0.15], ...wall, [rad - 0.35, neck], [0, neck]];
  const body = new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), P.crownFlutes * 8);
  cutFlutes(body, { axis: 'y', radius: rad, count: P.crownFlutes, depth: 0.35, from: grip[0], to: grip[1] });
  const tube = new THREE.CylinderGeometry(P.tubeDiameter / 2, P.tubeDiameter / 2, P.tubeLength + 0.3, 40).translate(0, neck + (P.tubeLength + 0.3) / 2, 0);
  return [{ geometry: body, material: 'polished' }, { geometry: tube, material: 'polished' }];
}
