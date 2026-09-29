import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { bracelet, endLinks } from '../../../../src/scene/exterior/kit/bracelet';
import { caseShape } from './case';
import { T } from './params';

// Solid end links that follow the case's curve and fill the gap between the lugs, then plain three-piece links.
export function tudorBracelet(m: MovementFrame): ExteriorLayer[] {
  const s = caseShape(m);
  const reach = s.hole.y + 1.2;
  const ends = endLinks(s.sdf, {
    z: s.hole.z, halfWidth: T.lugGap / 2 - 0.2, thickness: T.bracelet.thickness, chamfer: T.bracelet.chamfer,
    from: T.caseRadius - 6, reach, blend: 0, material: 'bracelet',
  });
  const links = bracelet({ startWidth: T.lugGap - 0.4, ...T.bracelet }, { y: reach, z: s.hole.z }, { center: 'bracelet', outer: 'bracelet' });
  return [...ends, ...links];
}
