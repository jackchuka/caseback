import * as THREE from 'three';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { bend, flipWinding } from '../../../../src/scene/exterior/kit/bend';
import { caseBack } from './case';
import { V } from './params';

const S = V.strap;

// The strap's centre height where it leaves the case: tucked under the wings, against the back.
export const strapZ = () => caseBack() - S.thickness / 2 + 0.2;

function taper(g: THREE.BufferGeometry, start: number, z: number) {
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, Math.max(0, (p.getY(i) - start) / S.length));
    p.setX(i, p.getX(i) * (1 - (1 - S.endWidth / S.width) * t));
    p.setZ(i, z + (p.getZ(i) - z) * (1 - (1 - S.endThickness / S.thickness) * t));
  }
  p.needsUpdate = true;
  return g;
}

// The black rubber strap: no lugs or spring bars show, each half runs out from under the case's back, a little
// toward 9 o'clock as on the photo, and curves round the wrist.
export function venturaStrap(): ExteriorLayer[] {
  const z = strapZ();
  return ([1, -1] as const).map((dir) => {
    const box = new THREE.BoxGeometry(S.width, S.length, S.thickness, 6, 70, 1).translate(0, S.start + S.length / 2, z);
    const g = taper(box, S.start, z);
    const placed = dir < 0 ? flipWinding(g.scale(1, -1, 1)) : g;
    return { geometry: bend(placed, S.wristRadius, S.start + S.straight, dir).translate(S.offsetX, 0, 0), material: 'strap', name: 'strap' };
  });
}
