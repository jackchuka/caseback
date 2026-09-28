import * as THREE from 'three';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { cutFlutes, fluteCount } from '../../../../src/scene/exterior/kit/flutes';
import { T } from './params';

// Distance of the crown's centre from the watch centre along the stem: past the case wall and the exposed tube.
export const crownX = () => T.caseRadius + T.tubeLength + T.crownLength / 2 - 0.1;

// The big crown: a flat end face (its engraved rose is left off), a deep fluted grip, and a short tube into the case.
// Local axis Y, +Y toward the case.
export function tudorCrown(): ExteriorLayer[] {
  const rad = T.crownDiameter / 2;
  const L = T.crownLength;
  const out = -L / 2, neck = L / 2;
  const grip: [number, number] = [out + 0.3, neck - 0.35];
  // The grip wall needs its own axial subdivisions (a straight profile line carries no interior vertices), so the
  // flutes actually cut the mid-grip surface rather than only its two end rings.
  const gripSteps = 8;
  const gripWall: Array<[number, number]> = Array.from({ length: gripSteps + 1 }, (_, i) => [rad, grip[0] + (i * (grip[1] - grip[0])) / gripSteps]);
  const body = new THREE.LatheGeometry(
    ([[0, out], [rad - 0.35, out], [rad, out + 0.25], ...gripWall, [rad - 0.3, neck], [0, neck]] as Array<[number, number]>).map(([x, y]) => new THREE.Vector2(x, y)),
    fluteCount(T.crownDiameter) * 4,
  );
  cutFlutes(body, { axis: 'y', radius: rad, count: fluteCount(T.crownDiameter), depth: 0.2, from: grip[0], to: grip[1] });
  const tube = new THREE.CylinderGeometry(T.tubeDiameter / 2, T.tubeDiameter / 2, T.tubeLength + 0.3, 48).translate(0, neck + (T.tubeLength + 0.3) / 2, 0);
  return [{ geometry: body, material: 'polished' }, { geometry: tube, material: 'steel' }];
}
