import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { layersBox } from '../../../../src/test/geometry';
import { belCantoHands } from './hands';
import { P } from './params';

const lume = (ls: { geometry: THREE.BufferGeometry; material: string }[]) => layersBox(ls.filter((l) => l.material === 'lume'));

describe('Bel Canto skeleton hands', () => {
  const h = belCantoHands();
  it('points both hands to 12 (−Y), symmetric about their axis', () => {
    for (const hand of [h.hour, h.minute]) {
      const b = layersBox(hand);
      expect(b.min.y).toBeLessThan(0);
      expect(b.max.y).toBeLessThan(-b.min.y);
      expect(b.max.x).toBeCloseTo(-b.min.x, 6);
    }
  });
  it('reaches the measured lengths', () => {
    expect(-layersBox(h.hour).min.y).toBeCloseTo(P.hands.hour, 1);
    expect(-layersBox(h.minute).min.y).toBeCloseTo(P.hands.minute, 1);
  });
  it('sweeps the minute hand over the chapter ring\'s track and inside its outer edge; the hour hand stops short of it', () => {
    expect(P.hands.minute).toBeGreaterThan(P.ticks.to);
    expect(P.hands.minute).toBeLessThan(P.ring.outer);
    expect(P.hands.hour).toBeLessThan(P.ring.inner);
  });
  it('fills a steel frame with lume, the frame standing proud of it', () => {
    for (const hand of [h.hour, h.minute]) {
      const l = lume(hand);
      expect(l.max.y).toBeLessThan(0);
      expect(layersBox([hand[0]!]).min.z).toBeLessThan(l.min.z);
    }
  });
  it('makes the hour hand wider than the minute hand', () => {
    const w = (ls: typeof h.hour) => { const b = layersBox(ls.slice(0, 1)); return b.max.x - b.min.x; };
    expect(w(h.hour)).toBeCloseTo(P.hands.hourWidth, 1);
    expect(w(h.minute)).toBeCloseTo(P.hands.minuteWidth, 1);
  });
  it('has no seconds hand', () => {
    expect(h.seconds).toEqual([]);
  });
  it('uses movement materials only', () => {
    for (const l of [...h.hour, ...h.minute]) expect(['steel', 'lume']).toContain(l.material);
  });
});
