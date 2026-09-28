import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { sinnDial } from './dial';
import { S } from './params';

const m = movementFrame(calibers['eta-2824-2']!);
const bbox = (g: THREE.BufferGeometry) => { g.computeBoundingBox(); return g.boundingBox!; };

describe('Sinn 556 dial', () => {
  const layers = sinnDial(m);
  const disc = layers.find((l) => l.material === 'dial')!;
  const bars = layers.filter((l) => l.material === 'dial-lume');
  const hits = (x: number, y: number) => new THREE.Raycaster(new THREE.Vector3(x, y, -10), new THREE.Vector3(0, 0, 1))
    .intersectObject(new THREE.Mesh(disc.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))).length;
  it('opens the movement\'s date window at 3 o\'clock and nowhere else', () => {
    expect(hits(m.dateWindow!.x, 0)).toBe(0);
    expect(hits(-m.dateWindow!.x, 0)).toBe(1);
    expect(hits(0, m.dateWindow!.x)).toBe(1);
  });
  it('stands twelve lume bars on the dial, all ending on the same circle', () => {
    expect(bars).toHaveLength(12);
    for (const l of bars) {
      const p = l.geometry.getAttribute('position');
      let r = 0;
      for (let i = 0; i < p.count; i++) r = Math.max(r, Math.hypot(p.getX(i), p.getY(i)));
      expect(r).toBeGreaterThan(S.indexOuter - 0.01);
      expect(r).toBeLessThan(S.indexOuter + 0.1);
      expect(bbox(l.geometry).max.z).toBeLessThanOrEqual(m.dialZ);
    }
  });
  it('shortens the 3 o\'clock bar to clear the date window', () => {
    const at = (x: number) => bars.find((l) => bbox(l.geometry).containsPoint(new THREE.Vector3(x, 0, bbox(l.geometry).getCenter(new THREE.Vector3()).z)))!;
    const three = at(S.indexOuter - 0.5);
    const b = bbox(three.geometry);
    expect(b.min.x).toBeGreaterThan(m.dateWindow!.x + m.dateWindow!.width / 2);
    expect(b.max.y - b.min.y).toBeCloseTo(S.hourBar.width, 2);
    const nine = bbox(at(-(S.indexOuter - 0.5)).geometry);
    expect(nine.max.x - nine.min.x).toBeCloseTo(S.indexOuter - S.hourBar.inner, 2);
  });
});
