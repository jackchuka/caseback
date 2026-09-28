import { describe, expect, it } from 'vitest';
import { cameraOffset, defaultCamera, parseTime } from './shots';

describe('compare shots', () => {
  it('reads the hands\' time as seconds since midnight', () => {
    expect(parseTime('10:08:37')).toBe(10 * 3600 + 8 * 60 + 37);
    expect(() => parseTime('10:08')).toThrow();
  });
  it('shifts the camera so the watch centre lands on the photo\'s centre pixel', () => {
    // 1000 × 800 photo, 0.05 mm per pixel, watch centre 100 px right of and 40 px above the middle.
    const [x, y] = cameraOffset({ mmPerPx: 0.05, center: [600, 360], rotation: [0, 0, 0] }, 1000, 800);
    expect(x).toBeCloseTo(-5, 9);
    expect(y).toBeCloseTo(2, 9);
  });
  it('frames a 60 mm field by default, centred', () => {
    const c = defaultCamera('side', 1200);
    expect(c.mmPerPx).toBeCloseTo(0.05, 9);
    expect(c.center).toEqual([600, 600]);
    expect(c.rotation).toEqual([0, Math.PI / 2, 0]);
  });
});
