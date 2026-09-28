import * as THREE from 'three';
import type { WatchExterior } from '../../model/watch';
import type { Layer } from '../../geometry/parts';
import type { CaseRadii } from '../caseGeometry';

const LUG_T = 2.4;

export function lugTips(e: WatchExterior, _r: CaseRadii) {
  return { y: e.case.lugToLugMm / 2, innerGap: e.case.lugWidthMm };
}

export function lugs(e: WatchExterior, r: CaseRadii): Layer[] {
  const tip = e.case.lugToLugMm / 2;
  const root = r.outer - 1.2;
  const front0 = r.bottom + 0.4;
  const back = r.bottom + r.height;
  const s = new THREE.Shape();
  // Front edge falls toward the wrist; the back edge stays near the caseback plane and curls at the tip.
  s.moveTo(root, front0);
  s.quadraticCurveTo((root + tip) / 2, front0 + 0.2, tip, front0 + 1.6);
  s.lineTo(tip, back - 0.2);
  s.quadraticCurveTo((root + tip) / 2, back + 0.1, root, back - 0.6);
  s.closePath();
  const hole = new THREE.Path();
  hole.absarc(tip - 1.3, back - 1.4, 0.5, 0, Math.PI * 2, true);
  s.holes.push(hole);
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
      g.computeVertexNormals();
      layers.push({ geometry: g, material: 'case' });
    }
  }
  return layers;
}
