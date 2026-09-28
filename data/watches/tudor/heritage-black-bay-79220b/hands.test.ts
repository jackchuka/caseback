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
  it('carries a lume plate on the hour hand at least three times the shaft width', () => {
    const plate = extent(h.hour.filter((l) => l.material === 'lume'));
    expect(plate.max.x - plate.min.x).toBeGreaterThan(3 * 0.7);
  });
  it('gives the seconds hand a counterweight tail and a square plate near its tip', () => {
    expect(extent(h.seconds).max.y).toBeGreaterThan(rd * 0.2);
    const plate = extent(h.seconds.filter((l) => l.material === 'lume'));
    expect(plate.max.y).toBeLessThan(-0.6 * T.seconds * rd);
  });
  it('uses movement materials only', () => {
    for (const l of [...h.hour, ...h.minute, ...h.seconds]) expect(['steel', 'lume']).toContain(l.material);
  });
});
