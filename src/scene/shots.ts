import type { Caliber } from '../model/schema';
import type { Mode } from '../state/store';
import { focusCenterLocal, toWorld, type Side, type V3 } from './focus';
import type { Shot } from './tween';

export const OVERVIEW_OFFSET: V3 = [-20, 32, 36];
export const INTRO_POSITION: V3 = [-24, 52, 62];
const ORIGIN: V3 = [0, 0, 0];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export function shotFor(c: Caliber, mode: Mode, stepIndex: number, freeSide: Side = 'back'): Shot {
  const flipOf = (side: Side) => (side === 'dial' ? Math.PI : 0);
  switch (mode) {
    case 'intro':
      return { target: ORIGIN, position: INTRO_POSITION, flip: 0, duration: 0, delay: 0 };
    case 'opening':
      return { target: ORIGIN, position: OVERVIEW_OFFSET, flip: 0, duration: 2.2, delay: 1.4 };
    case 'free':
      return { target: ORIGIN, position: OVERVIEW_OFFSET, flip: flipOf(freeSide), duration: 1.4, delay: 0 };
    case 'tour': {
      const step = c.tour[stepIndex]!;
      const target = step.focus ? toWorld(focusCenterLocal(c, step.focus, step.side), step.side) : ORIGIN;
      return { target, position: add(target, step.cameraOffset), flip: flipOf(step.side), duration: 1.8, delay: 0 };
    }
  }
}
