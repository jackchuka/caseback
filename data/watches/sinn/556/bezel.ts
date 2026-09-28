import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { crystal } from '../../../../src/scene/exterior/kit/crystal';
import { crease, flange, lathe } from '../../../../src/scene/exterior/kit/lathe';
import { bezelTop, caseFront } from './case';
import { S } from './params';

// The flat sapphire's front face: well below the bezel top, at the foot of its chamfer.
export const crystalFront = (m: MovementFrame) => bezelTop(m) + S.crystalDrop;

// The fixed bezel: a broad flat satin top, a steep inner chamfer down to the crystal, a small round on the outer edge.
export function sinnBezel(m: MovementFrame): ExteriorLayer[] {
  const b = caseFront(m), top = bezelTop(m), glass = crystalFront(m);
  // (radius, z), front is −Z: the wall hugging the crystal, the chamfer's foot, the flat top, the rounded outer edge.
  // Every corner is a hard crease, so the flat top shades flat rather than like a doughnut.
  const corners: Array<[number, number]> = [
    [S.crystalRadius, b - 0.02], [S.crystalRadius, glass - 0.05], [S.bezelLip, glass - 0.15],
    [S.bezelFlat, top], [S.bezelOuter - S.bezelEdge, top], [S.bezelOuter, top + S.bezelEdge],
    [S.bezelOuter, b - 0.02], [S.crystalRadius, b - 0.02],
  ];
  const body = lathe(corners.flatMap((p, i) => (i === 0 || i === corners.length - 1 ? [p] : crease(p))), 240);
  return [
    { geometry: body, material: 'bezel' },
    // The flange (rehaut) closes the wall between the dial's edge and the case front, which stands proud of the dial.
    { geometry: flange([S.dialRadius, m.dialZ - 0.01], [S.crystalRadius, b]), material: 'flange', name: 'flange' },
  ];
}

export function sinnCrystal(m: MovementFrame): ExteriorLayer[] {
  return crystal({ radius: S.crystalRadius - 0.02, rim: crystalFront(m), dome: 0, foot: caseFront(m) + 0.3 });
}
