import * as THREE from 'three';
import type { WatchExterior } from '../../model/watch';
import type { Layer } from '../../geometry/parts';
import type { CaseRadii } from '../caseGeometry';

export function crystalRadius(e: WatchExterior, r: CaseRadii) {
  return r.outer - (e.bezel.kind === 'dive' ? e.bezel.widthMm : 0.3) - 0.2;
}

export function crystal(e: WatchExterior, r: CaseRadii): Layer[] {
  const cr = crystalRadius(e, r);
  const dome = Math.max(0.05, e.crystal.domeMm);
  // Spherical cap with base radius cr and height dome: sphere radius R = (cr² + h²) / 2h.
  const R = (cr * cr + dome * dome) / (2 * dome);
  const theta = Math.asin(cr / R);
  const cap = new THREE.SphereGeometry(R, 96, 24, 0, Math.PI * 2, 0, theta);
  // The cap's apex is at +Y (y = R) and its rim at y = R − dome. rotateX(−π/2) maps y → −z, so the apex goes to
  // z = −R and the rim to z = −(R − dome). Translating by rimZ + R − dome seats the rim at rimZ (just in front of
  // the case face) and puts the apex dome millimetres further forward.
  const rimZ = r.bottom - 1.0;
  cap.rotateX(-Math.PI / 2).translate(0, 0, rimZ + R - dome);
  return [{ geometry: cap, material: 'crystal' }];
}
