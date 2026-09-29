import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { endLinks, hLinkBracelet } from '../../../../src/scene/exterior/kit/bracelet';
import { caseShape } from './case';
import { S } from './params';

// Solid end links that follow the case's curve and fill the gap between the lugs, then the H-link bracelet.
export function sinnBracelet(m: MovementFrame): ExteriorLayer[] {
  const s = caseShape(m);
  const reach = s.hole.y + 1.2;
  // photo:front: the end link and first links read the full 20 mm between the lugs.
  const ends = endLinks(s.sdf, {
    z: s.hole.z, halfWidth: S.lugGap / 2 - 0.05, thickness: S.bracelet.thickness, chamfer: S.bracelet.chamfer,
    from: S.caseRadius - 6, reach, blend: 0.3, material: 'bracelet',
  });
  const links = hLinkBracelet({ startWidth: S.lugGap - 0.1, ...S.bracelet }, { y: reach, z: s.hole.z }, { center: 'bracelet', outer: 'bracelet' });
  return [...ends, ...links];
}
