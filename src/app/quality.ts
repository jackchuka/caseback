import type { Quality } from '../state/store';

// Decide from the device, not the window: a tab opened in the background or next to DevTools can report a tiny
// innerWidth at startup, which used to lock a desktop into low quality for the whole session.
export function qualityFor({ coarse, screenWidth }: { coarse: boolean; screenWidth: number }): Quality {
  if (coarse) return 'low';
  return screenWidth > 0 && screenWidth <= 768 ? 'low' : 'high';
}

export function detectQuality(): Quality {
  return qualityFor({ coarse: matchMedia('(pointer: coarse)').matches, screenWidth: screen.width });
}
