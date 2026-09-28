import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { hamiltonHands } from './hands';
import { H } from './params';

const extent = (ls: { geometry: THREE.BufferGeometry }[]) => {
  const b = new THREE.Box3();
  for (const l of ls) { l.geometry.computeBoundingBox(); b.union(l.geometry.boundingBox!); }
  return b;
};
const lume = (ls: { geometry: THREE.BufferGeometry; material: string }[]) => extent(ls.filter((l) => l.material === 'lume'));

describe('Khaki Field lance hands', () => {
  const h = hamiltonHands();
  it('reaches the hour numerals, the minute track and the lume dots', () => {
    expect(-extent(h.hour).min.y).toBeCloseTo(H.hour, 1);
    expect(-extent(h.minute).min.y).toBeCloseTo(H.minute, 1);
    expect(-extent(h.seconds).min.y).toBeCloseTo(H.seconds, 1);
    expect(-extent(h.minute).min.y).toBeLessThan(H.flangeInner);
  });
  it('fills each lance with lume over the measured span, and ends it in a steel needle', () => {
    for (const [hand, span, len] of [[h.hour, H.hourLume, H.hour], [h.minute, H.minuteLume, H.minute]] as const) {
      const l = lume(hand);
      expect(-l.max.y).toBeGreaterThan(span[0]);
      expect(-l.max.y).toBeLessThan(span[0] + 0.5);
      expect(-l.min.y).toBeGreaterThan(span[1]);
      expect(len + l.min.y).toBeGreaterThan(1);
    }
  });
  it('makes the hour lance wider than the minute lance, as measured', () => {
    const w = (ls: typeof h.hour) => { const b = extent(ls.slice(0, 1)); return b.max.x - b.min.x; };
    expect(w(h.hour)).toBeCloseTo(H.hourWidth, 1);
    expect(w(h.minute)).toBeCloseTo(H.minuteWidth, 1);
  });
  it('tips the seconds hand with a lume arrow and gives it a tail', () => {
    const l = lume(h.seconds);
    expect(-l.min.y).toBeGreaterThan(H.seconds - 0.5);
    expect(-l.max.y).toBeGreaterThan(H.seconds - H.arrow[0]);
    expect(extent(h.seconds).max.y).toBeCloseTo(H.secondsTail, 1);
  });
  it('sets the lume inside a frame that stands proud of it', () => {
    for (const hand of [h.hour, h.minute]) expect(extent([hand[0]!]).min.z).toBeLessThan(lume(hand).min.z);
  });
  it('uses movement materials only', () => {
    for (const l of [...h.hour, ...h.minute, ...h.seconds]) expect(['steel', 'lume']).toContain(l.material);
  });
});
