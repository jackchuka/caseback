import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { watches } from '../../../../data/watches';
import { watchHands } from './hands';

const extent = (layers: { geometry: THREE.BufferGeometry }[]) => {
  const b = new THREE.Box3();
  for (const l of layers) { l.geometry.computeBoundingBox(); b.union(l.geometry.boundingBox!); }
  return b;
};

describe('watch hands', () => {
  for (const w of Object.values(watches)) {
    const e = w.exterior;
    const rd = 16;
    const h = watchHands(e, rd);
    it(`${w.id}: sizes the hands to the dial like the real watch`, () => {
      const hour = extent(h.hour), minute = extent(h.minute), seconds = extent(h.seconds);
      // Hands point to −Y. Hour hand reaches the numerals, the minute hand the minute track.
      expect(-hour.min.y / rd).toBeGreaterThan(0.55);
      expect(-hour.min.y / rd).toBeLessThan(0.7);
      expect(-minute.min.y / rd).toBeGreaterThan(0.85);
      expect(-minute.min.y).toBeLessThan(rd);
      expect(-seconds.min.y).toBeLessThan(rd);
      // Readable widths: well over a millimetre, not the movement's 0.3 mm wires.
      expect(hour.max.x - hour.min.x).toBeGreaterThan(1.2);
      expect(minute.max.x - minute.min.x).toBeGreaterThan(1.0);
      // The seconds hand carries a counterweight tail past the pivot.
      expect(seconds.max.y).toBeGreaterThan(rd * 0.2);
    });
    it(`${w.id}: fills the hour and minute hands with lume in front of a metal frame`, () => {
      for (const hand of [h.hour, h.minute]) {
        const lume = hand.filter((l) => l.material === 'lume');
        const frame = hand.filter((l) => l.material !== 'lume');
        expect(lume.length).toBeGreaterThan(0);
        expect(frame.length).toBeGreaterThan(0);
        expect(extent(lume).min.z).toBeLessThan(extent(frame).min.z + 0.01);
      }
    });
  }
});
