import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { closedAndOutward } from '../../../../src/scene/exterior/kit/meshCheck';
import { caseShape, tudorCase } from './case';
import { T } from './params';

const m = movementFrame(calibers['eta-2824-2']!);

describe('Tudor 79220B case', () => {
  const s = caseShape(m);
  const t0 = performance.now();
  const layers = tudorCase(m, 0.3);
  const buildMs = performance.now() - t0;
  const g = layers[0]!.geometry;
  g.computeBoundingBox();
  const b = g.boundingBox!;
  const mid = (m.frontZ + s.back) / 2;

  it('is 41 mm across and spans the lug-to-lug length', () => {
    expect(b.max.x - b.min.x).toBeCloseTo(2 * T.caseRadius, 0);
    expect(b.max.y - b.min.y).toBeCloseTo(T.lugToLug, 0);
  });
  it('leaves exactly the lug width free between the lugs', () => {
    const y = T.lugToLug / 2 - 4;
    expect(s.sdf(T.lugGap / 2 - 0.25, y, mid)).toBeGreaterThan(0);
    expect(s.sdf(T.lugGap / 2 + 0.25, y, mid)).toBeLessThan(0);
  });
  it('has vertical flanks', () => {
    const inset = T.bevel + 0.3;
    expect(s.sdf(-(T.caseRadius - 0.05), 0, m.frontZ + inset)).toBeLessThan(0);
    expect(s.sdf(-(T.caseRadius - 0.05), 0, s.back - 0.5)).toBeLessThan(0);
    expect(s.sdf(-(T.caseRadius + 0.05), 0, mid)).toBeGreaterThan(0);
  });
  const tip = T.lugToLug / 2;
  const lugX = T.lugGap / 2 + T.lugWidth / 2;
  // Outer edge of the plan outline at height y, found by walking in from the bounds.
  const outerX = (y: number) => {
    let x = T.caseRadius + 0.4;
    while (s.sdf(x, y, mid) > 0) x -= 0.01;
    return x;
  };

  it('curves the lug top down from the bezel edge all the way to the tip', () => {
    const edge = Math.sqrt(T.caseRadius ** 2 - lugX ** 2);
    const dip = (y: number) => s.front(lugX, y) - m.frontZ;
    expect(dip(edge - 0.5)).toBeCloseTo(0, 5);
    expect(dip(edge + 2)).toBeGreaterThan(0.08 * T.lugDrop);
    expect(dip(tip - 0.5)).toBeGreaterThan(0.9 * T.lugDrop);
    for (let y = edge; y < tip; y += 0.5) expect(dip(y + 0.5)).toBeGreaterThan(dip(y));
    expect(s.front(0, T.caseRadius - 0.1)).toBeCloseTo(m.frontZ, 5);
  });
  it('rounds the lug heel up from the flat caseback seat', () => {
    expect(s.sdf(lugX, 0.5 * tip, s.back - 0.3)).toBeLessThan(0);
    expect(s.sdf(lugX, tip - 0.3, s.back - 0.3)).toBeGreaterThan(0);
  });
  it('runs the case edge straight out to the lug tip, with no notch', () => {
    const ys = Array.from({ length: 13 }, (_, i) => 8 + i * 1.25);
    const xs = ys.map(outerX);
    for (let i = 1; i < xs.length; i++) expect(xs[i]!).toBeLessThan(xs[i - 1]!);
    // A concave notch would pull the middle sample inside the chord between its neighbours.
    for (let i = 1; i < xs.length - 1; i++) expect(xs[i]! - (xs[i - 1]! + xs[i + 1]!) / 2).toBeGreaterThan(-0.05);
  });
  it('makes the lugs wide wedges, as measured on the front photo', () => {
    expect(outerX(tip - 1) - T.lugGap / 2).toBeCloseTo(T.lugWidth + 0.35, 0);
    expect(outerX(tip - 5) - T.lugGap / 2).toBeGreaterThan(4);
    expect(outerX(12)).toBeGreaterThan(Math.sqrt(T.caseRadius ** 2 - 12 ** 2) + 1);
  });
  it('polishes the bevel and flank, brushes the top', () => {
    const z = m.frontZ + T.bevel / 2;
    expect(s.polish(-(T.caseRadius - T.bevel / 2), 0, z)).toBeGreaterThan(0.9);
    expect(s.polish(-(T.caseRadius - T.bevel - 0.6), 0, m.frontZ)).toBeLessThan(0.1);
    expect(s.polish(-T.caseRadius, 0, mid)).toBeGreaterThan(0.9);
  });
  it('drills a blind spring-bar hole from the inner face of each lug', () => {
    expect(s.sdf(T.lugGap / 2 + 0.3, s.hole.y, s.hole.z)).toBeGreaterThan(0);
    expect(s.sdf(T.lugGap / 2 + T.lugWidth - 0.3, s.hole.y, s.hole.z)).toBeLessThan(0);
  });
  it('is one closed, outward-facing surface', () => {
    expect(layers).toHaveLength(1);
    const { open, volume } = closedAndOutward(g);
    expect(open).toBe(0);
    expect(volume).toBeGreaterThan(0);
  });
  it('builds within budget', () => {
    expect(buildMs).toBeLessThan(1500);
  });
  it('carries a polish attribute per vertex', () => {
    expect(g.getAttribute('polish').count).toBe(g.getAttribute('position').count);
  });
});
