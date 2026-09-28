import * as THREE from 'three';
import type { LegacyConfig } from './config';
import type { Layer } from '../../../geometry/parts';
import type { CaseRadii } from './radii';

export function crownX(e: LegacyConfig, r: CaseRadii) {
  return r.outer + e.crown.lengthMm / 2 - 0.2;
}

// Grip flutes about 0.55 mm apart, as cut on the reference crowns.
export function fluteCount(diameterMm: number) {
  return Math.max(16, Math.round((Math.PI * diameterMm) / 0.55));
}

// A crown turned on a lathe: a slightly domed end face with a chamfer, a fluted grip, and a neck stepping down to the
// tube. Its axis is local Y with +Y toward the case.
export function crown(e: LegacyConfig, _r: CaseRadii): Layer[] {
  const rad = e.crown.diameterMm / 2;
  const L = e.crown.lengthMm;
  const out = -L / 2;
  const neck = L / 2;
  const grip: [number, number] = [out + 0.35, neck - 0.55];
  const profile: Array<[number, number]> = [
    [0, out - 0.12],
    [rad * 0.55, out - 0.06],
    [rad - 0.3, out],
    [rad, out + 0.3],
    [rad, grip[0]],
    [rad, grip[1]],
    [rad - 0.35, neck - 0.2],
    [rad * 0.62, neck - 0.1],
    [rad * 0.62, neck],
    [0, neck],
  ];
  const n = fluteCount(e.crown.diameterMm);
  const body = new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), n * 4);
  const p = body.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const rr = Math.hypot(p.getX(i), p.getZ(i));
    if (rr < rad - 0.01 || y < grip[0] - 0.01 || y > grip[1] + 0.01) continue;
    const a = Math.atan2(p.getZ(i), p.getX(i));
    // Rounded grooves: the flute depth follows a raised cosine around each groove centre.
    const k = 1 - (0.14 / rad) * Math.max(0, Math.cos(a * n)) ** 2;
    p.setXYZ(i, p.getX(i) * k, y, p.getZ(i) * k);
  }
  body.computeVertexNormals();
  const layers: Layer[] = [{ geometry: body, material: 'polished' }];
  if (e.crown.tube) layers.push({ geometry: new THREE.CylinderGeometry(rad * 0.55, rad * 0.55, 0.9, 32).translate(0, L / 2 + 0.35, 0), material: 'tube' });
  return layers;
}
