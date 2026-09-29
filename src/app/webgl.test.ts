import { describe, expect, it } from 'vitest';
import { shadowsSupported } from './webgl';

describe('shadowsSupported', () => {
  it('turns shadows off on PowerVR, whose driver resets under shadow-map sampling', () => {
    expect(shadowsSupported('ANGLE (Imagination Technologies, PowerVR D-Series DXT-48-1536, OpenGL ES 3.2)')).toBe(false);
    expect(shadowsSupported('PowerVR Rogue GE8320')).toBe(false);
  });

  it('keeps shadows on other GPUs', () => {
    expect(shadowsSupported('ANGLE (Apple, ANGLE Metal Renderer: Apple M3, Unspecified Version)')).toBe(true);
    expect(shadowsSupported('Mali-G715')).toBe(true);
    expect(shadowsSupported('')).toBe(true);
  });
});
