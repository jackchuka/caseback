import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { closedAndOutward } from '../../../../src/scene/exterior/kit/meshCheck';
import { expectRotorClears, radii, rotorOf, zRange } from '../../../../src/test/geometry';
import { bezelTop, caseBack, caseFront, caseShape, crystalTop, sinnCase, sinnCaseback } from './case';
import { P } from './params';

const caliber = calibers['valjoux-7750']!;
const m = movementFrame(caliber);

describe('Sinn 103 case', () => {
  const s = caseShape(m);
  const mid = (caseFront(m) + caseBack(m)) / 2;
  // Outer edge of the plan outline at height y on the 9 o'clock side.
  const outerX = (y: number) => {
    let x = P.guard.outer + 1;
    while (s.plan(-x, y) > 0) x -= 0.01;
    return x;
  };
  it('hangs off the stem axis at the heights measured on the side photo', () => {
    expect(m.stemZ - crystalTop(m)).toBeCloseTo(P.crystalTopToStem, 9);
    expect(caseFront(m) - bezelTop(m)).toBeCloseTo(P.bezelHeight, 9);
    expect(m.stemZ).toBeGreaterThan(caseFront(m));
    expect(m.stemZ).toBeLessThan(caseBack(m));
  });
  it('leaves exactly the lug width free between the lugs', () => {
    const y = P.lugToLug / 2 - 2;
    const z = (s.front(P.lugGap / 2 + 1, y) + s.underside(P.lugGap / 2 + 1, y)) / 2;
    expect(s.sdf(P.lugGap / 2 - 0.25, y, z)).toBeGreaterThan(0);
    expect(s.sdf(P.lugGap / 2 + 0.6, y, z)).toBeLessThan(0);
  });
  it('follows the front photo\'s lug outline: straight outer edges in toward a diagonal tip', () => {
    // photo:front silhouette, left side, 0.0734 mm/px.
    const measured: Array<[number, number]> = [[14.07, 15.05], [17.6, 14.25], [20.5, 13.6], [22.57, 11.5], [23.16, 10.5]];
    for (const [y, x] of measured) expect(Math.abs(outerX(y) - x), `y=${y}`).toBeLessThan(0.25);
  });
  it('drops the lug tops steeply to a tall tip face', () => {
    const x = P.lugGap / 2 + 1.5, tip = P.lugToLug / 2 - 0.1;
    expect(s.front(x, tip) - m.stemZ).toBeCloseTo(P.lugTopAtTip, 0);
    expect(s.underside(x, tip) - s.front(x, tip)).toBeGreaterThan(2.5);
    for (let y = 16; y < tip; y += 0.5) expect(s.front(x, y + 0.5)).toBeGreaterThanOrEqual(s.front(x, y));
  });
  it('stands two guards out of the 3 o\'clock flank with the crown between them', () => {
    const G = P.guard;
    expect(s.sdf(G.outer - 0.2, (G.notch + G.flat) / 2, mid)).toBeLessThan(0);
    expect(s.sdf(G.outer + 0.1, (G.notch + G.flat) / 2, mid)).toBeGreaterThan(0);
    expect(s.sdf(P.caseRadius + 0.3, 0, mid)).toBeGreaterThan(0);
    expect(s.sdf(-(P.caseRadius + 0.3), (G.notch + G.flat) / 2, mid)).toBeGreaterThan(0);
  });
});

describe('Sinn 103 case mesh', () => {
  let g: THREE.BufferGeometry;
  beforeAll(() => { g = sinnCase(m, 0.3)[0]!.geometry; });
  it('spans the lug-to-lug length and the guards', () => {
    g.computeBoundingBox();
    const b = g.boundingBox!;
    expect(b.max.y - b.min.y).toBeCloseTo(P.lugToLug, 0);
    expect(b.max.x).toBeCloseTo(P.guard.outer, 0);
  });
  it('is one closed, outward-facing surface', () => {
    const { open, volume } = closedAndOutward(g);
    expect(open).toBe(0);
    expect(volume).toBeGreaterThan(0);
  });
});

describe('Sinn 103 thickness and display back', () => {
  let back: ExteriorLayer[];
  beforeAll(() => { back = sinnCaseback(m); });
  const rotor = rotorOf(caliber);

  it('is 17 mm from crystal apex to caseback glass, as published', () => {
    expect(zRange(back)[1] - crystalTop(m)).toBeCloseTo(P.totalThickness, 5);
  });
  it('shows the movement through a glass that clears the rotor, closed or lifting off', () => {
    const glass = back.find((l) => l.name === 'caseback-glass')!;
    const ring = back.find((l) => l !== glass)!;
    expectRotorClears(rotor, { floor: zRange([glass])[0], pocket: Math.min(...radii(ring.geometry)), span: zRange(back) });
  });
});
