import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { flange, lathe } from '../../../../src/scene/exterior/kit/lathe';
import { caseFront } from './case';
import { P } from './params';

export const bezelTop = (m: MovementFrame) => caseFront(m) - P.bezelHeight;

// A plain polished bezel with a broad rounded shoulder, and the flange that closes the well between the dial's edge
// and the crystal seat.
export function presageBezel(m: MovementFrame): ExteriorLayer[] {
  const b = caseFront(m);
  const top = bezelTop(m);
  const r = P.bezelRound;
  const arc = Array.from({ length: 9 }, (_, i): [number, number] => {
    const a = (i / 8) * (Math.PI / 2);
    return [P.bezelOuter - r + r * Math.sin(a), top + r - r * Math.cos(a)];
  });
  const body = lathe([[P.bezelInner, b - 0.02], [P.bezelInner, top + 0.08], [P.bezelInner + 0.1, top], ...arc, [P.bezelOuter, b - 0.02], [P.bezelInner, b - 0.02]], 240);
  const rehaut = flange([P.dialRadius, m.dialZ - 0.21], [P.crystalRadius, top + 0.05], 240);
  return [
    { geometry: body, material: 'polished' },
    { geometry: rehaut, material: 'flange', name: 'flange' },
  ];
}
