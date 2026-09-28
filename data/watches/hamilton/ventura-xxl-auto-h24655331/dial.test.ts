import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { cornerAngles, dialPanels, isRed, lanceMinutes, reach, venturaDial } from './dial';
import { V } from './params';
import { outlines } from './plan';

const caliber = calibers['eta-2824-2']!;
const m = movementFrame(caliber);

describe('Ventura dial', () => {
  const layers = venturaDial(m);
  const cast = (material: string, x: number, y: number) => {
    const meshes = layers.filter((l) => l.material === material).map((l) => new THREE.Mesh(l.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })));
    return new THREE.Raycaster(new THREE.Vector3(x, y, -10), new THREE.Vector3(0, 0, 1)).intersectObjects(meshes).length;
  };
  it('follows the case opening and faces the front', () => {
    const disc = layers.find((l) => l.name === 'dial')!.geometry;
    disc.computeBoundingBox();
    const b = disc.boundingBox!;
    const xs = outlines.dial.map(([x]) => x);
    expect(b.min.x).toBeCloseTo(Math.min(...xs), 3);
    expect(b.max.x).toBeCloseTo(Math.max(...xs), 3);
    expect(b.min.z).toBeCloseTo(m.dialZ, 5);
    expect(disc.getAttribute('normal').getZ(0)).toBeLessThan(0);
  });
  it('opens three grille panels between the arms, where the movement shows through', () => {
    const panels = dialPanels();
    expect(panels).toHaveLength(3);
    for (const p of panels) {
      const c = p.reduce((a, q) => [a[0] + q[0] / p.length, a[1] + q[1] / p.length], [0, 0]);
      expect(cast('dial', c[0], c[1])).toBe(0);
      expect(cast('dial-grille', c[0], c[1])).toBe(1);
    }
    // The arms and the hub stay solid dial.
    expect(cast('dial', 0, 0)).toBe(1);
    expect(cast('dial', -6, 0)).toBe(1);
    const [cx, cy] = V.dialPanels.corners[1]!;
    expect(cast('dial', cx / 2, cy / 2)).toBe(1);
  });
  it('sets the grille behind the dial face, in front of the date ring', () => {
    const g = layers.find((l) => l.material === 'dial-grille')!.geometry;
    g.computeBoundingBox();
    const ring = caliber.parts.find((p) => p.id === 'date-ring')!;
    expect(g.boundingBox!.min.z).toBeGreaterThan(m.dialZ);
    expect(g.boundingBox!.max.z).toBeLessThan(ring.pos.z - 0.08);
  });
  it('places a faceted lance at each corner of the triangle, pointing at the pivot', () => {
    const lances = layers.filter((l) => l.name === 'lance');
    expect(lances).toHaveLength(3);
    cornerAngles().forEach((a, i) => {
      lances[i]!.geometry.computeBoundingBox();
      const c = lances[i]!.geometry.boundingBox!.getCenter(new THREE.Vector3());
      expect(Math.atan2(c.x, -c.y)).toBeCloseTo(a > Math.PI ? a - 2 * Math.PI : a, 1);
      expect(Math.hypot(c.x, c.y)).toBeLessThan(reach(outlines.dial, a) - V.lance.length / 2 + 0.5);
    });
  });
  it('prints red hatching from 12 round to 3, clear of the 1 o\'clock lance, and skips the ticks under the lances', () => {
    expect(isRed(2)).toBe(true);
    expect(isRed(12)).toBe(true);
    expect(isRed(5)).toBe(false);
    expect(isRed(30)).toBe(false);
    expect(lanceMinutes()).toEqual([45, 5, 25]);
  });
});
