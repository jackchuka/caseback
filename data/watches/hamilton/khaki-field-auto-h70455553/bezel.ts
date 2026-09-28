import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { lathe } from '../../../../src/scene/exterior/kit/lathe';
import { caseFront } from './case';
import { H } from './params';

// The bezel's inner lip, its frontmost ring.
export const bezelTop = (m: MovementFrame) => caseFront(m) - H.bezelHeight;

// A fixed, polished bezel turned in one piece with no insert: a short chamfer at the lip that mirrors the dark
// studio (the black ring around the crystal in the photos), then a wide, slightly convex slope out to the brushed
// case top.
export function bezelProfile(m: MovementFrame): Array<[number, number]> {
  const F = caseFront(m), top = bezelTop(m);
  const slope: Array<[number, number]> = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const r = H.bezelChamfer + (H.bezelOuter - 0.1 - H.bezelChamfer) * t;
    // Convex: the drop steepens toward the outer edge.
    return [r, top + 0.08 + H.bezelDrop * t ** 1.5];
  });
  return [
    [H.bezelInner, F - 0.02], [H.bezelInner, top + 0.25], [H.bezelInner + 0.15, top], [H.bezelChamfer - 0.1, top],
    ...slope,
    [H.bezelOuter, top + 0.08 + H.bezelDrop + 0.1], [H.bezelOuter, F - 0.02], [H.bezelInner, F - 0.02],
  ];
}

export function hamiltonBezel(m: MovementFrame): ExteriorLayer[] {
  const F = caseFront(m);
  // The flange (rehaut) closes the wall between the dial's edge and the case front, which stands proud of the dial.
  const flange = lathe([[H.flangeInner, m.dialZ - 0.02], [H.bezelInner, F - 0.1]], 180);
  return [
    { geometry: lathe(bezelProfile(m), 360), material: 'polished', name: 'bezel' },
    { geometry: flange, material: 'flange', name: 'flange' },
  ];
}
