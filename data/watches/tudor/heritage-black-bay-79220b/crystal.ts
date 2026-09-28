import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { crystal } from '../../../../src/scene/exterior/kit/crystal';
import { bezelTop } from './bezel';
import { T } from './params';

// A box sapphire: a short straight wall standing out of the bezel, capped by a spherical dome.
export function tudorCrystal(m: MovementFrame): ExteriorLayer[] {
  return crystal({ radius: T.crystalRadius, rim: bezelTop(m) - T.crystalWall, dome: T.crystalDome, foot: bezelTop(m) + 0.3 });
}
