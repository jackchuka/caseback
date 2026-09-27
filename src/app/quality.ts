import type { Quality } from '../state/store';

export function detectQuality(): Quality {
  const coarse = matchMedia('(pointer: coarse)').matches;
  return coarse || innerWidth <= 768 ? 'low' : 'high';
}
