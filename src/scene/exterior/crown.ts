import * as THREE from 'three';
import type { WatchExterior } from '../../model/watch';
import type { Layer } from '../../geometry/parts';
import type { CaseRadii } from '../caseGeometry';

export function crownX(e: WatchExterior, r: CaseRadii) {
  return r.outer + e.crown.lengthMm / 2 - 0.2;
}

export function crown(e: WatchExterior, r: CaseRadii): Layer[] {
  const rad = e.crown.diameterMm / 2;
  const body = new THREE.CylinderGeometry(rad, rad, e.crown.lengthMm, 64, 1);
  // Knurling: push every other vertex ring inward to make grip ridges.
  const p = body.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i));
    const k = 1 - 0.04 * (Math.round((a / (Math.PI * 2)) * 64) % 2);
    if (Math.hypot(p.getX(i), p.getZ(i)) > rad * 0.9) p.setXYZ(i, p.getX(i) * k, p.getY(i), p.getZ(i) * k);
  }
  body.computeVertexNormals();
  const layers: Layer[] = [{ geometry: body, material: 'case' }];
  if (e.crown.tube) layers.push({ geometry: new THREE.CylinderGeometry(rad * 0.55, rad * 0.55, 0.9, 32).translate(0, -e.crown.lengthMm / 2 - 0.35, 0), material: 'tube' });
  return layers;
}
