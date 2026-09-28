import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { hollowCaseback } from './caseback';
import { flutedCrown } from './crown';
import { crystal } from './crystal';
import { atHour, dialDisc, offsetConvex } from './dial';
import { handFrame, handPlate, mirror } from './hands';
import { flange } from './lathe';
import { closedAndOutward } from './meshCheck';
import { softFinish } from './polish';

const box = (g: THREE.BufferGeometry) => { g.computeBoundingBox(); return g.boundingBox!; };
const hits = (g: THREE.BufferGeometry, x: number, y: number) =>
  new THREE.Raycaster(new THREE.Vector3(x, y, -10), new THREE.Vector3(0, 0, 1)).intersectObject(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))).length;

describe('kit parts', () => {
  it('hollows a solid back into a closed rim and an engraved plate', () => {
    const [plate, rim] = hollowCaseback({ radius: 18, taper: 0.3, seat: 4, thickness: 1.2, pocket: 13, back: { kind: 'solid', plate: 0.1 } });
    expect(plate!.name).toBe('caseback-solid');
    expect(box(plate!.geometry).min.z).toBeCloseTo(5.1, 5);
    expect(closedAndOutward(rim!.geometry).volume).toBeGreaterThan(0);
  });
  it('sets a display back\'s glass into the ring, recessed from its outer face', () => {
    const [ring, glass] = hollowCaseback({ radius: 18, taper: 0.3, seat: 4, thickness: 1.5, pocket: 13, back: { kind: 'display', glass: 0.8, recess: 0.1 } });
    expect(glass!.material).toBe('caseback-glass');
    expect(box(glass!.geometry).max.z).toBeCloseTo(5.4, 5);
    expect(box(glass!.geometry).min.z).toBeCloseTo(4.6, 5);
    expect(box(ring!.geometry).max.x).toBeCloseTo(18, 5);
    expect(closedAndOutward(ring!.geometry).volume).toBeGreaterThan(0);
  });
  it('cuts a window through the dial where asked, and faces the dial front', () => {
    const plain = dialDisc(15, -2);
    const cut = dialDisc(15, -2, { x: 10.8, y: 0, width: 2.4, height: 1.8 });
    expect(hits(plain, 10.8, 0)).toBe(1);
    expect(hits(cut, 10.8, 0)).toBe(0);
    expect(hits(cut, 10.8, 1.2)).toBe(1);
    expect(hits(cut, -10.8, 0)).toBe(1);
    expect(box(cut).max.z).toBeCloseTo(-2, 5);
  });
  it('places an index at its hour with the outer edge on the ring', () => {
    const g = atHour(new THREE.BoxGeometry(1, 2, 0.1).translate(0, 1, 0), 3, 12, -2);
    const b = box(g);
    expect(b.max.x).toBeCloseTo(12, 5);
    expect(b.min.x).toBeCloseTo(10, 5);
  });
  it('grows a convex polygon by the offset along every edge', () => {
    const sq = offsetConvex([[0, 0], [2, 0], [2, 2], [0, 2]], 0.5);
    expect(sq[0]![0]).toBeCloseTo(-0.5, 5);
    expect(sq[2]![1]).toBeCloseTo(2.5, 5);
  });
  it('builds a flat crystal when it has no dome', () => {
    const g = crystal({ radius: 16, rim: -5, dome: 0, foot: -4 })[0]!.geometry;
    expect(box(g).min.z).toBeCloseTo(-5, 5);
    expect(box(g).max.x).toBeCloseTo(16, 5);
    const domed = crystal({ radius: 16, rim: -5, dome: 1, foot: -4 })[0]!.geometry;
    expect(box(domed).min.z).toBeCloseTo(-6, 5);
  });
  it('turns a flange from the dial edge out to the case', () => {
    const b = box(flange([15, -2], [16, -4]));
    expect(b.min.z).toBeCloseTo(-4, 5);
    expect(b.max.z).toBeCloseTo(-2, 5);
  });
  it('domes a crown\'s end face outward when asked', () => {
    const flat = box(flutedCrown({ diameter: 6, length: 4, fluteDepth: 0.15, tube: { diameter: 3, length: 0.5 } })[0]!.geometry);
    const domed = box(flutedCrown({ diameter: 6, length: 4, fluteDepth: 0.15, tube: { diameter: 3, length: 0.5 }, end: { inset: 0.4, run: 0.4, dome: 0.5 } })[0]!.geometry);
    expect(flat.min.y).toBeCloseTo(-2, 5);
    expect(domed.min.y).toBeCloseTo(-2.5, 5);
  });
  it('frames a lume window with a ridge standing proud of the lume plate', () => {
    const outline = mirror([[1, 0], [1, -8], [0, -9]]);
    const window = mirror([[0.7, -0.5], [0.7, -7.6], [0, -8.4]]);
    expect(box(handFrame(outline, window, 0, 0.2)).min.z).toBeLessThan(box(handPlate(window, 0.12, -0.02)).min.z);
  });
  it('lets the nearest face set the finish', () => {
    expect(softFinish([[0, 0], [1, -1]])).toBeLessThan(0.01);
    expect(softFinish([[0, -1], [1, 0]])).toBeGreaterThan(0.99);
    expect(softFinish([[0, 0], [1, 0]])).toBeCloseTo(0.5, 5);
  });
});
