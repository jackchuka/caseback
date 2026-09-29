import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { crystal } from '../../../../src/scene/exterior/kit/crystal';
import { caseFront, crystalApex } from './case';
import { P } from './params';

export { crystalApex };

// The domed sapphire: its rim just proud of the bezel ring, its wall running down inside the ring to the case front.
export function belCantoCrystal(m: MovementFrame): ExteriorLayer[] {
  return crystal({ radius: P.crystalRadius, rim: crystalApex(m) + P.domeHeight, dome: P.domeHeight, foot: caseFront(m) });
}
