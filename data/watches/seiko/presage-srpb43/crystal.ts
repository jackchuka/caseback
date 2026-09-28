import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { lathe } from '../../../../src/scene/exterior/kit/lathe';
import { bezelTop } from './bezel';
import { crystalTop } from './case';
import { P } from './params';

// A tall box crystal: a straight wall standing out of the bezel, a rounded top edge and a nearly flat top.
export function presageCrystal(m: MovementFrame): ExteriorLayer[] {
  const r = P.crystalRadius;
  const apex = crystalTop(m);
  const s = P.crystalShoulder;
  const rim = apex + P.crystalDome;
  const R = ((r - s) ** 2 + P.crystalDome ** 2) / (2 * P.crystalDome);
  const theta = Math.asin((r - s) / R);
  const dome = Array.from({ length: 17 }, (_, i): [number, number] => {
    const a = (i / 16) * theta;
    return [R * Math.sin(a), apex + R * (1 - Math.cos(a))];
  });
  const shoulder = Array.from({ length: 9 }, (_, i): [number, number] => {
    const a = ((i + 1) / 9) * (Math.PI / 2);
    return [r - s + s * Math.sin(a), rim + s - s * Math.cos(a)];
  });
  return [{ geometry: lathe([...dome, ...shoulder, [r, bezelTop(m) + 0.3]], 240), material: 'crystal' }];
}
