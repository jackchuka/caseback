import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { hLinkBracelet } from '../../../../src/scene/exterior/kit/bracelet';
import { extrudeProfile } from '../../../../src/scene/exterior/kit/sdf';
import { surfaceNets } from '../../../../src/scene/exterior/kit/surfaceNets';
import { caseShape } from './case';
import { S } from './params';

const CLEAR = 0.1;
const EDGE_OPTS = { chamfer: S.bracelet.chamfer, backChamfer: 0, edge: 0.15 };

// Solid end links that follow the case's curve and fill the gap between the lugs, then the H-link bracelet.
export function sinnBracelet(m: MovementFrame): ExteriorLayer[] {
  const s = caseShape(m);
  const lw = S.lugGap / 2 - 0.2;
  const th = S.bracelet.thickness;
  const reach = s.hole.y + 1.2;
  const layers: ExteriorLayer[] = [];
  for (const dir of [1, -1] as const) {
    // Tested against the case's own sdf, so the link hugs the drum and lug flanks with an exact clearance.
    const sdf = (x: number, y: number, z: number) => {
      const plate = extrudeProfile(Math.abs(x) - lw, s.hole.z - th / 2 - z, z - (s.hole.z + th / 2), EDGE_OPTS);
      return Math.max(plate, CLEAR - s.sdf(x, y, z), y * dir - reach);
    };
    const near = S.caseRadius - 6, far = reach + 0.5;
    const g = surfaceNets(sdf, [-lw - 0.5, dir > 0 ? near : -far, s.hole.z - th], [lw + 0.5, dir > 0 ? far : -near, s.hole.z + th], 0.15);
    layers.push({ geometry: g, material: 'bracelet', name: 'end-link' });
  }
  const links = hLinkBracelet({ startWidth: S.lugGap - 0.4, ...S.bracelet }, { y: reach, z: s.hole.z }, { center: 'bracelet', outer: 'bracelet' });
  return [...layers, ...links];
}
