import { describe, expect, it } from 'vitest';
import { layersBox } from '../../../../src/test/geometry';
import { venturaHands } from './hands';
import { V } from './params';

describe('Ventura hands', () => {
  const h = venturaHands();
  it('reaches the measured lengths, the minute hand the track', () => {
    expect(-layersBox(h.hour).min.y).toBeCloseTo(V.hour, 1);
    expect(-layersBox(h.minute).min.y).toBeCloseTo(V.minute, 1);
    expect(-layersBox(h.seconds).min.y).toBeCloseTo(V.seconds, 1);
    expect(layersBox(h.seconds).max.y).toBeCloseTo(V.secondsTail, 1);
  });
  it('makes the hour sword wider than the minute sword', () => {
    const w = (ls: typeof h.hour) => { const b = layersBox(ls.slice(0, 1)); return b.max.x - b.min.x; };
    expect(w(h.hour)).toBeCloseTo(V.hourWidth, 1);
    expect(w(h.minute)).toBeCloseTo(V.minuteWidth, 1);
  });
  it('reddens only the seconds hand\'s tip, in the movement\'s ruby', () => {
    const red = h.seconds.filter((l) => l.material === 'ruby');
    expect(red).toHaveLength(1);
    expect(-layersBox(red).max.y).toBeCloseTo(V.seconds - V.secondsRed, 1);
  });
  it('uses movement materials only', () => {
    for (const l of [...h.hour, ...h.minute, ...h.seconds]) expect(['steel', 'ruby']).toContain(l.material);
  });
});
