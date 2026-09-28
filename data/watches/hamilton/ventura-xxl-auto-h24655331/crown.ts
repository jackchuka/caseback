import * as THREE from 'three';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { cutFlutes } from '../../../../src/scene/exterior/kit/flutes';
import { V } from './params';

// The crown's centre on the stem axis: it starts at the housing's outer face.
export const crownX = () => V.housing.collar[1] + V.crownLength / 2;

// The fluted crown: full diameter at the housing, a rounded shoulder a third of the way out, then tapering to a
// smaller flat end (its engraved logo left off). Local axis Y, +Y toward the case.
export function venturaCrown(): ExteriorLayer[] {
  const R = V.crownDiameter / 2, r = V.crownEndDiameter / 2, L = V.crownLength;
  const out = -L / 2, inner = L / 2;
  const shoulder = out + L * 0.38;
  const profile: Array<[number, number]> = [
    [0, out], [r - 0.35, out], [r - 0.05, out + 0.12], [r + 0.2, out + 0.4], [R - 0.3, shoulder - 0.15], [R, shoulder + 0.2],
    ...Array.from({ length: 6 }, (_, i): [number, number] => [R, shoulder + 0.2 + ((inner - 0.2 - shoulder - 0.2) * (i + 1)) / 6]),
    [R - 0.2, inner], [0, inner],
  ];
  const body = new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), V.crownFlutes * 8);
  cutFlutes(body, { axis: 'y', radius: R, count: V.crownFlutes, depth: 0.4, from: shoulder, to: inner - 0.15 });
  // A tube into the housing, so pulling the crown out shows the stem's sleeve rather than a gap.
  const tube = new THREE.CylinderGeometry(1.3, 1.3, 1.6, 40).translate(0, inner + 0.8, 0);
  return [{ geometry: body, material: 'polished' }, { geometry: tube, material: 'steel' }];
}
