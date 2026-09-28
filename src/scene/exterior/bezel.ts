import * as THREE from 'three';
import type { WatchExterior } from '../../model/watch';
import type { Layer } from '../../geometry/parts';
import type { CaseRadii } from '../caseGeometry';
import { bezelProfile } from '../caseGeometry';

const lathe = (pts: Array<[number, number]>) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 180).rotateX(Math.PI / 2);

// Plain bezels in (radius, z), front is −z. They stop short of the case's polished bevel so it still shows, and
// reach a little into the case front so no gap opens between the separate parts.
export function plainBezelProfile(e: WatchExterior, r: CaseRadii): Array<[number, number]> {
  const b = r.bottom;
  const inner = r.outer - e.bezel.widthMm;
  const outer = r.outer - e.case.chamferMm * 0.6;
  if (e.bezel.profile === 'rounded') {
    // Sinn: a flat brushed ring with a rounded outer shoulder.
    const q = Array.from({ length: 7 }, (_, i): [number, number] => {
      const a = (i / 6) * (Math.PI / 2);
      return [outer - 0.6 + 0.6 * Math.sin(a), b - 0.5 - 0.6 * Math.cos(a)];
    });
    return [[inner, b + 0.05], [inner, b - 1.1], ...q, [outer, b + 0.05], [inner, b + 0.05]];
  }
  // Hamilton: a narrow polished slope from the crystal down to the case edge.
  return [[inner, b + 0.05], [inner, b - 1.05], [inner + 0.25, b - 1.1], [outer - 0.2, b - 0.35], [outer, b - 0.15], [outer, b + 0.05], [inner, b + 0.05]];
}

export function bezel(e: WatchExterior, r: CaseRadii): Layer[] {
  const metal = e.bezel.finish === 'polished' ? 'polished' : 'case';
  if (e.bezel.kind !== 'dive') return [{ geometry: lathe(plainBezelProfile(e, r)), material: metal }];
  const o = r.outer;
  const layers: Layer[] = [{ geometry: lathe(bezelProfile(o, r.bottom)), material: metal }];
  // Coin edge: 120 shallow grooves around the rim.
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    layers.push({ geometry: new THREE.BoxGeometry(0.1, 0.2, 0.5).translate(0, -(o - 0.12), r.bottom - 0.5).rotateZ(a), material: metal });
  }
  const insertIn = o - e.bezel.widthMm;
  const insert = new THREE.RingGeometry(insertIn, o - 0.45, 180).rotateX(Math.PI).translate(0, 0, r.bottom - 1.03);
  layers.push({ geometry: insert, material: 'insert' });
  return layers;
}
