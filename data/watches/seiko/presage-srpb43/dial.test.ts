import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { dagger, presageDial } from './dial';
import { P } from './params';

const m = movementFrame(calibers['seiko-nh35a']!);
const bbox = (g: THREE.BufferGeometry) => { g.computeBoundingBox(); return g.boundingBox!; };

describe('Presage SRPB43 dial', () => {
  const layers = presageDial(m);
  const disc = layers.find((l) => l.material === 'dial')!;
  const indices = layers.filter((l) => l.name === 'index');
  const hits = (x: number, y: number) => {
    const mesh = new THREE.Mesh(disc.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    return new THREE.Raycaster(new THREE.Vector3(x, y, -10), new THREE.Vector3(0, 0, 1)).intersectObject(mesh).length;
  };
  it('opens a window over the NH35A\'s date at 3, SII\'s 2.9 × 2.0 mm at 10.55 mm', () => {
    expect(hits(10.55, 0)).toBe(0);
    expect(hits(10.55, 1.2)).toBeGreaterThan(0);
    expect(hits(-10.55, 0)).toBeGreaterThan(0);
  });
  it('applies twelve daggers on one outer circle, the 3 o\'clock one cut short outside the window', () => {
    expect(indices).toHaveLength(12);
    const three = bbox(indices[3]!.geometry);
    expect(three.min.x).toBeGreaterThan(m.dateWindow!.x + m.dateWindow!.width / 2 + P.windowFrame);
    const twelve = bbox(indices[0]!.geometry);
    expect(-twelve.min.y).toBeCloseTo(P.index.outer * P.dialRadius, 1);
    expect(twelve.max.y - twelve.min.y).toBeCloseTo(P.index.length * P.dialRadius, 1);
  });
  it('frames the window in polished steel', () => {
    const f = bbox(layers.find((l) => l.name === 'date-frame')!.geometry);
    // Plus the frame's small edge bevel either side.
    expect(f.max.x - f.min.x).toBeCloseTo(m.dateWindow!.width + 2 * P.windowFrame + 0.08, 2);
  });
  it('cuts each dagger into two facets that face the viewer and meet in a ridge', () => {
    const g = dagger(4, 1.4, 0.3);
    const n = g.getAttribute('normal');
    const p = g.getAttribute('position');
    let left = 0, right = 0;
    for (let i = 0; i < n.count; i += 3) {
      if (n.getZ(i) > -0.3) continue;
      const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
      if (cx < 0) left++;
      else right++;
      expect(Math.sign(n.getX(i))).toBe(Math.sign(cx) || Math.sign(n.getX(i)));
    }
    expect(left).toBeGreaterThan(0);
    expect(right).toBeGreaterThan(0);
    expect(bbox(g).min.z).toBeCloseTo(-0.3, 5);
  });
});
