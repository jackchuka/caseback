import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { crystal } from '../../../../src/scene/exterior/kit/crystal';
import { bezelTop } from './bezel';
import { H } from './params';

// The sapphire's front rim, just proud of the bezel lip.
export const crystalRim = (m: MovementFrame) => bezelTop(m) - H.crystalProud;

// A sapphire sitting in the bezel lip, its front face domed very slightly; the wall runs down inside the lip.
export function hamiltonCrystal(m: MovementFrame): ExteriorLayer[] {
  const rim = crystalRim(m);
  return crystal({ radius: H.crystalRadius, rim, dome: H.crystalDome, foot: rim + H.crystalThickness });
}
