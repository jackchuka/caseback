import { describe, expect, it } from 'vitest';
import { qualityFor } from './quality';

describe('qualityFor', () => {
  it('uses the screen, not a transient window size, so a tab opened narrow still renders sharply', () => {
    expect(qualityFor({ coarse: false, screenWidth: 1440 })).toBe('high');
    expect(qualityFor({ coarse: false, screenWidth: 0 })).toBe('high');
  });
  it('drops to low quality on touch devices and small screens', () => {
    expect(qualityFor({ coarse: true, screenWidth: 1024 })).toBe('low');
    expect(qualityFor({ coarse: false, screenWidth: 390 })).toBe('low');
  });
});
