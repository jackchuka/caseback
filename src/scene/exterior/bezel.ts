import * as THREE from 'three';
import type { WatchExterior } from '../../model/watch';
import type { Layer } from '../../geometry/parts';
import type { CaseRadii } from '../caseGeometry';
import { bezelProfile } from '../caseGeometry';

export function bezel(e: WatchExterior, r: CaseRadii): Layer[] {
  if (e.bezel.kind !== 'dive') return [];
  const o = r.outer;
  const ring = new THREE.LatheGeometry(bezelProfile(o, r.bottom).map(([x, y]) => new THREE.Vector2(x, y)), 180).rotateX(Math.PI / 2);
  const layers: Layer[] = [{ geometry: ring, material: 'case' }];
  // Coin edge: 120 shallow grooves around the rim.
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    layers.push({ geometry: new THREE.BoxGeometry(0.1, 0.2, 0.5).translate(0, -(o - 0.12), r.bottom - 0.5).rotateZ(a), material: 'case' });
  }
  const insertIn = o - e.bezel.widthMm;
  const insert = new THREE.RingGeometry(insertIn, o - 0.45, 180).rotateX(Math.PI).translate(0, 0, r.bottom - 1.03);
  layers.push({ geometry: insert, material: 'insert' });
  return layers;
}
