import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { layersBox } from '../../../../src/test/geometry';
import { sinnHands } from './hands';
import { S } from './params';

describe('Sinn 556 hands', () => {
  const h = sinnHands();
  const lume = (ls: { geometry: THREE.BufferGeometry; material: string }[]) => layersBox(ls.filter((l) => l.material === 'lume'));
  it('reaches the measured lengths', () => {
    expect(-layersBox(h.hour).min.y).toBeCloseTo(S.hands.hour, 1);
    expect(-layersBox(h.minute).min.y).toBeCloseTo(S.hands.minute, 1);
    expect(-layersBox(h.seconds).min.y).toBeCloseTo(S.hands.seconds, 1);
    expect(-layersBox(h.minute).min.y).toBeLessThan(S.hourBar.inner + 2.5);
  });
  it('fills the swords with lume only past their black base', () => {
    for (const [hand, base, len] of [[h.hour, S.hands.hourBase, S.hands.hour], [h.minute, S.hands.minuteBase, S.hands.minute]] as const) {
      const p = lume(hand);
      expect(-p.max.y).toBeGreaterThan(base);
      expect(-p.min.y).toBeGreaterThan(len - 0.5);
      // In front of the black plate.
      expect(p.min.z).toBeLessThan(layersBox(hand.slice(0, 1)).min.z);
    }
    expect((lume(h.hour).max.x - lume(h.hour).min.x)).toBeGreaterThan(0.7 * S.hands.hourWidth);
  });
  it('paints the seconds hand white with a black tail', () => {
    expect(-lume(h.seconds).max.y).toBeCloseTo(S.hands.secondsWhiteFrom, 1);
    expect(layersBox(h.seconds.filter((l) => l.material === 'slot')).max.y).toBeCloseTo(S.hands.tail, 1);
  });
  it('uses movement materials only', () => {
    for (const l of [...h.hour, ...h.minute, ...h.seconds]) expect(['slot', 'lume']).toContain(l.material);
  });
});
