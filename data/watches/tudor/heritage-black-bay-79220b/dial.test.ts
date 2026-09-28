import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { tudorDial } from './dial';
import { T } from './params';

const m = movementFrame(calibers['eta-2824-2']!);
const bbox = (g: THREE.BufferGeometry) => { g.computeBoundingBox(); return g.boundingBox!; };

describe('Tudor 79220B dial', () => {
  const layers = tudorDial(m);
  const lume = layers.filter((l) => l.material === 'dial-lume');
  it('applies twelve indices, each in a polished surround', () => {
    expect(lume).toHaveLength(12);
    expect(layers.filter((l) => l.material === 'polished')).toHaveLength(12);
  });
  it('lays the 3 and 9 bars across and the 6 bar along the radius', () => {
    const at = (h: number) => {
      const a = (h / 12) * Math.PI * 2;
      const ri = T.indexRing * T.dialRadius;
      return lume.find((l) => bbox(l.geometry).containsPoint(new THREE.Vector3(Math.sin(a) * ri, -Math.cos(a) * ri, bbox(l.geometry).getCenter(new THREE.Vector3()).z)))!;
    };
    const w = (h: number) => { const b = bbox(at(h).geometry); return [b.max.x - b.min.x, b.max.y - b.min.y] as const; };
    expect(w(3)[0]).toBeGreaterThan(w(3)[1]);
    expect(w(9)[0]).toBeGreaterThan(w(9)[1]);
    expect(w(6)[1]).toBeGreaterThan(w(6)[0]);
  });
  it('has no date window', () => {
    const disc = layers.find((l) => l.material === 'dial')!;
    const mesh = new THREE.Mesh(disc.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    const hit = new THREE.Raycaster(new THREE.Vector3(m.dateWindow!.x, 0, -10), new THREE.Vector3(0, 0, 1)).intersectObject(mesh);
    expect(hit.length).toBeGreaterThan(0);
  });
});
