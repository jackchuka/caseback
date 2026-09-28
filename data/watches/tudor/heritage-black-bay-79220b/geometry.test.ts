import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import tudor79220b from './exterior';

const m = movementFrame(calibers['eta-2824-2']!);

// Vertex count, bounding box and coordinate sums per layer: any change to a part's geometry shows up here, so moving
// its code into the shared kit is proven not to have moved a single vertex.
const fingerprint = (ls: ExteriorLayer[]) =>
  ls.map((l) => {
    const p = l.geometry.getAttribute('position');
    const b = new THREE.Box3().setFromBufferAttribute(p as THREE.BufferAttribute);
    let sx = 0, sy = 0, sz = 0;
    for (let i = 0; i < p.count; i++) { sx += Math.abs(p.getX(i)); sy += Math.abs(p.getY(i)); sz += p.getZ(i); }
    const r = (v: number) => Math.round(v * 1000) / 1000;
    return `${l.name ?? ''}:${String(l.material)} n=${p.count} i=${l.geometry.index?.count ?? 0} box=${[b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z].map(r).join(',')} sum=${[sx, sy, sz].map((v) => r(v / 10)).join(',')}`;
  });

describe('Tudor 79220B geometry fingerprint', () => {
  const p = tudor79220b.geometry({ movement: m, quality: 'low' }).parts;
  it('is unchanged', () => {
    expect({
      case: fingerprint(p.case), bezel: fingerprint(p.bezel), dial: fingerprint(p.dial), crystal: fingerprint(p.crystal), strap: fingerprint(p.strap),
      caseback: fingerprint(p.caseback), crown: fingerprint(p.crown), hour: fingerprint(p.hands.hour), minute: fingerprint(p.hands.minute), seconds: fingerprint(p.hands.seconds),
    }).toMatchSnapshot();
  });
});
