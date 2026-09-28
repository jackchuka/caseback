import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { bracelet } from '../../../../src/scene/exterior/kit/bracelet';
import { surfaceNets } from '../../../../src/scene/exterior/kit/surfaceNets';
import { caseShape } from './case';
import { T } from './params';

const CLEAR = 0.1;

// Solid end links that follow the case's curve and fill the gap between the lugs, then plain three-piece links.
export function tudorBracelet(m: MovementFrame): ExteriorLayer[] {
  const s = caseShape(m);
  const lw = T.lugGap / 2 - 0.2;
  const th = T.bracelet.thickness;
  const reach = s.hole.y + 1.2;
  const layers: ExteriorLayer[] = [];
  for (const dir of [1, -1] as const) {
    // The case's boundary bulges outward near the lug root (fillet blend), so a plain circle of radius caseRadius
    // undershoots it there and lets the link sink into the case; testing the case's own sdf keeps clearance exact.
    const sdf = (x: number, y: number, z: number) => {
      const ay = y * dir;
      return Math.max(Math.abs(x) - lw, CLEAR - s.sdf(x, y, z), ay - reach, Math.abs(z - s.hole.z) - th / 2);
    };
    const y0 = dir > 0 ? T.caseRadius - 6 : -(reach + 0.5);
    const y1 = dir > 0 ? reach + 0.5 : -(T.caseRadius - 6);
    // surfaceNets needs min < max on every axis; guard the ordering explicitly rather than relying on dir's sign.
    const g = surfaceNets(sdf, [-lw - 0.5, Math.min(y0, y1), s.hole.z - th], [lw + 0.5, Math.max(y0, y1), s.hole.z + th], 0.15);
    layers.push({ geometry: g, material: 'bracelet', name: 'end-link' });
  }
  const links = bracelet({ startWidth: T.lugGap - 0.4, ...T.bracelet }, { y: reach, z: s.hole.z }, { center: 'bracelet', outer: 'bracelet' });
  return [...layers, ...links];
}
