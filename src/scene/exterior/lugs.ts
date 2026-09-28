import * as THREE from 'three';
import type { WatchExterior } from '../../model/watch';
import type { Layer } from '../../geometry/parts';
import type { CaseRadii } from '../caseGeometry';
import { flipWinding } from './bend';

const LUG_T = 2.4;
// Fraction of the case height the lug tip drops toward the wrist, and the lug's front-to-back depth (mm).
export const LUG_DROP = 0.9;
const LUG_DEPTH = 2.8;

export function lugTipZ(r: CaseRadii) {
  return r.bottom + LUG_DROP * r.height + LUG_DEPTH * 0.3;
}


export function lugTips(e: WatchExterior, _r: CaseRadii) {
  return { y: e.case.lugToLugMm / 2, innerGap: e.case.lugWidthMm };
}

export function lugs(e: WatchExterior, r: CaseRadii): Layer[] {
  const tip = e.case.lugToLugMm / 2;
  // Lugs sit beside the 12/6 axis (x ≈ ±lugWidth/2 … +LUG_T), where the round case edge is well inside r.outer;
  // start the root there, sunk 1 mm into the case, so the lug grows out of the case instead of floating beside it.
  const xOuter = e.case.lugWidthMm / 2 + LUG_T + 0.2;
  const root = Math.sqrt(Math.max(0, r.outer ** 2 - xOuter ** 2)) - 1.0;
  const top = r.bottom + r.height;
  const drop = LUG_DROP * r.height;
  const knee = root + 0.35 * (tip - root);
  const s = new THREE.Shape();
  // Side profile as on the real cases: the lug leaves the case flush with its front face, runs flat, then sweeps
  // down toward the wrist in one arc; the underside follows the arc back into the case.
  s.moveTo(root, r.bottom);
  s.lineTo(knee, r.bottom);
  s.bezierCurveTo(knee + (tip - knee) * 0.55, r.bottom, tip - 0.4, r.bottom + drop * 0.55, tip, r.bottom + drop);
  s.lineTo(tip - 0.9, r.bottom + drop + LUG_DEPTH * 0.6);
  s.bezierCurveTo(tip - 1.8, r.bottom + drop * 0.5 + LUG_DEPTH, knee + 1, top - 0.2, root, top - 0.3);
  s.closePath();
  const one = new THREE.ExtrudeGeometry(s, { depth: LUG_T, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 3, curveSegments: 24 });
  // ExtrudeGeometry vertices are (u = radial distance, v = Z, w = extrusion 0..LUG_T); map them to
  // X = ±(lugWidth/2 + w), Y = ±u, Z = v so a pair's inner faces sit exactly lugWidth apart.
  const layers: Layer[] = [];
  for (const side of [1, -1] as const) {
    for (const sx of [1, -1] as const) {
      const g = one.clone();
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const w = pos.getZ(i);
        pos.setXYZ(i, sx * (e.case.lugWidthMm / 2 + w), side * u, v);
      }
      pos.needsUpdate = true;
      // Mirroring across X (sx) or Y (side) alone turns the mesh inside out; swap triangle winding back.
      if (sx * side < 0) flipWinding(g);
      g.computeVertexNormals();
      layers.push({ geometry: g, material: 'case' });
    }
  }
  return layers;
}

const FILLET_R = 4;

// Concave blend between each lug's outer face (x = lugWidth/2 + LUG_T) and the round case, as machined on real
// cases. In top view the fillet circle is tangent to both the lug face and the case circle; the filled region is
// the curved triangle between them, extruded through the case band where the lug is still full height.
export function lugFillets(e: WatchExterior, r: CaseRadii): Layer[] {
  const X = e.case.lugWidthMm / 2 + LUG_T;
  const R = r.outer;
  const f = FILLET_R;
  const cx = X + f;
  const cy = Math.sqrt((R + f) ** 2 - cx ** 2);
  const y0 = Math.sqrt(R ** 2 - X ** 2);
  const tangentAngle = Math.atan2(-cy, -cx);
  const onCase = Math.atan2(cy, cx);
  const s = new THREE.Shape();
  s.moveTo(X, y0 - 0.5);
  s.lineTo(X, cy);
  s.absarc(cx, cy, f, Math.PI, tangentAngle + Math.PI * 2, false);
  s.absarc(0, 0, R - 0.05, onCase, Math.atan2(y0 - 0.5, X), false);
  s.closePath();
  // Start below the case's front chamfer and round the fillet's edges so it melts into the chamfer and the lug.
  const front = r.bottom + 0.35;
  const depth = r.height - 0.9;
  const one = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 4, curveSegments: 24 }).translate(0, 0, front + 0.3);
  const layers: Layer[] = [];
  for (const sx of [1, -1] as const) {
    for (const sy of [1, -1] as const) {
      const g = one.clone().scale(sx, sy, 1);
      if (sx * sy < 0) flipWinding(g);
      g.computeVertexNormals();
      layers.push({ geometry: g, material: 'case' });
    }
  }
  return layers;
}
