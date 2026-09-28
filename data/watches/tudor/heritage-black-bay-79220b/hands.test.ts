import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { tudorHands } from './hands';
import { T } from './params';

const extent = (ls: { geometry: THREE.BufferGeometry }[]) => {
  const b = new THREE.Box3();
  for (const l of ls) { l.geometry.computeBoundingBox(); b.union(l.geometry.boundingBox!); }
  return b;
};

describe('Tudor 79220B snowflake hands', () => {
  const rd = T.dialRadius;
  const h = tudorHands(rd);
  it('reaches the indices, the minute track and the dial edge', () => {
    expect(-extent(h.hour).min.y / rd).toBeGreaterThan(0.55);
    expect(-extent(h.hour).min.y / rd).toBeLessThan(0.7);
    expect(-extent(h.minute).min.y / rd).toBeGreaterThan(0.85);
    expect(-extent(h.minute).min.y).toBeLessThan(rd);
    expect(-extent(h.seconds).min.y).toBeLessThan(rd);
  });
  const lume = (ls: { geometry: THREE.BufferGeometry; material: string }[]) => extent(ls.filter((l) => l.material === 'lume'));
  it('carries a diamond lume plate on the hour hand about a quarter of the dial radius across', () => {
    const p = lume(h.hour);
    const frame = extent(h.hour.slice(0, 1));
    expect(frame.max.x - frame.min.x).toBeGreaterThan(3 * 2 * T.hands.hourShaft);
    expect((p.max.x - p.min.x) / rd).toBeGreaterThan(0.22);
    expect((p.max.x - p.min.x) / rd).toBeLessThan(0.28);
  });
  it('runs the hour lume from near the pivot through the plate into the tip', () => {
    const p = lume(h.hour);
    expect(-p.max.y).toBeLessThan(0.15 * rd);
    expect(-p.min.y / (T.hour * rd)).toBeGreaterThan(0.93);
  });
  it('fills most of the minute sword with lume', () => {
    const s = extent(h.minute.filter((l) => l.material === 'steel').slice(0, 1));
    const p = lume(h.minute);
    expect(s.max.x - s.min.x).toBeCloseTo(T.hands.minuteWidth, 2);
    expect((p.max.x - p.min.x) / (s.max.x - s.min.x)).toBeGreaterThan(0.5);
    expect(-p.min.y / (T.minute * rd)).toBeGreaterThan(0.9);
  });
  it('gives the seconds hand a diamond plate at the photo position and a lume-free counterweight', () => {
    expect(extent(h.seconds).max.y).toBeGreaterThan(rd * 0.25);
    const p = lume(h.seconds);
    const centre = -(p.max.y + p.min.y) / 2 / rd;
    expect(centre).toBeGreaterThan(0.55);
    expect(centre).toBeLessThan(0.7);
    expect(p.max.y).toBeLessThan(0);
  });
  it('sets the lume in a rounded frame that stands proud of it', () => {
    for (const hand of [h.hour, h.minute]) {
      const frame = hand[0]!.geometry;
      expect(extent([hand[0]!]).min.z).toBeLessThan(lume(hand).min.z);
      // A rounded section has faces tilted all the way from the view axis to the side, not just a flat top.
      const n = frame.getAttribute('normal');
      const tilts = new Set<number>();
      for (let i = 0; i < n.count; i++) if (n.getZ(i) < 0) tilts.add(Math.round((Math.acos(-n.getZ(i)) * 180) / Math.PI / 15));
      expect([1, 2, 3, 4, 5].every((b) => tilts.has(b))).toBe(true);
    }
  });
  it('uses movement materials only', () => {
    for (const l of [...h.hour, ...h.minute, ...h.seconds]) expect(['steel', 'lume']).toContain(l.material);
  });
});
