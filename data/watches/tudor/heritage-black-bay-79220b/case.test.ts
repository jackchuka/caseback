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
  it('dips the lug tips toward the wrist', () => {
    expect(s.front(T.lugToLug / 2 - 0.5) - m.frontZ).toBeGreaterThan(0.8 * T.lugDrop);
    expect(s.front(T.caseRadius - 2)).toBeCloseTo(m.frontZ, 5);
  });
  it('polishes the bevel and flank, brushes the top', () => {
    const z = m.frontZ + T.bevel / 2;
    expect(s.polish(-(T.caseRadius - T.bevel / 2), 0, z)).toBeGreaterThan(0.9);
    expect(s.polish(-(T.caseRadius - T.bevel - 0.6), 0, m.frontZ)).toBeLessThan(0.1);
    expect(s.polish(-T.caseRadius, 0, mid)).toBeGreaterThan(0.9);
  });
  it('drills the spring-bar hole through the lugs', () => {
    expect(s.sdf(T.lugGap / 2 + T.lugWidth / 2, s.hole.y, s.hole.z)).toBeGreaterThan(0);
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
