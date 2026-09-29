import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { cornerAngles, dialPanels, isRed, lanceMinutes, reach, venturaDial } from './dial';
import { V } from './params';
import { outlines } from './plan';

const caliber = calibers['eta-2824-2']!;
const m = movementFrame(caliber);

const inside = (poly: [number, number][], x: number, y: number) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!, [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

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
  it('tapers the arms from the hub out to the corners', () => {
    const [cx, cy] = V.dialPanels.corners[1]!;
    const len = Math.hypot(cx, cy);
    const n = [-cy / len, cx / len];
    const across = (t: number, w: number) => cast('dial', cx * t + n[0]! * w, cy * t + n[1]! * w);
    const near = 2.2 / len, far = 0.7;
    expect(across(near, 1.0)).toBe(1);
    expect(across(far, 0.95)).toBe(0);
    expect(across(far, 0.5)).toBe(1);
  });
  it('sets the grille behind the dial face, in front of the date ring', () => {
    const g = layers.find((l) => l.material === 'dial-grille')!.geometry;
    g.computeBoundingBox();
    const ring = caliber.parts.find((p) => p.id === 'date-ring')!;
    expect(g.boundingBox!.min.z).toBeGreaterThan(m.dialZ);
    expect(g.boundingBox!.max.z).toBeLessThan(ring.pos.z - 0.08);
  });
  it('shows no date through the grille: the H-10 here is a no-date calibre, so the date ring is shaded out', () => {
    const ring = caliber.parts.find((p) => p.id === 'date-ring')!;
    if (ring.shape.kind !== 'date-ring') throw new Error('shape');
    const { innerRadius, outerRadius } = ring.shape;
    const shade = layers.filter((l) => l.material === 'dial-shade');
    expect(shade.length).toBeGreaterThan(0);
    for (const l of shade) {
      l.geometry.computeBoundingBox();
      const b = l.geometry.boundingBox!;
      // Behind the grille, in front of the ring's face.
      expect(b.min.z).toBeGreaterThan(m.dialZ + 0.08);
      expect(b.max.z).toBeLessThan(ring.pos.z - ring.shape.thickness / 2);
    }
    // Every panel point over the ring is covered, from the 3 o'clock window round the whole ring.
    for (const p of dialPanels()) {
      for (let a = 0; a < 2 * Math.PI; a += Math.PI / 90) {
        for (const r of [innerRadius + 0.05, (innerRadius + outerRadius) / 2, outerRadius - 0.05]) {
          const x = r * Math.cos(a), y = r * Math.sin(a);
          if (!inside(p, x, y)) continue;
          expect(cast('dial-shade', x, y)).toBe(1);
        }
      }
    }
    // The motion works inside the ring still show.
    expect(cast('dial-shade', -4, 3)).toBe(0);
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
