import * as THREE from 'three';
import type { WatchExterior } from '../../model/watch';
import type { Layer } from '../../geometry/parts';
import type { CaseRadii } from '../caseGeometry';
import { bend, flipWinding } from './bend';

const WRIST_RADIUS = 26;
const LENGTH = 38;

export function strap(e: WatchExterior, r: CaseRadii): Layer[] {
  const tip = e.case.lugToLugMm / 2 - 1.3;
  const z = r.bottom + r.height - 1.4;
  const layers: Layer[] = [];
  for (const dir of [1, -1] as const) {
    if (e.strap.kind === 'bracelet') {
      const links = 14;
      for (let i = 0; i < links; i++) {
        const g = new THREE.BoxGeometry(e.case.lugWidthMm - 0.4, LENGTH / links - 0.25, 2.0, 2, 2, 1).translate(0, tip + (i + 0.5) * (LENGTH / links), z);
        layers.push({ geometry: bend(dir < 0 ? flipWinding(g.scale(1, dir, 1)) : g, WRIST_RADIUS, tip, dir), material: 'strap' });
      }
    } else {
      const g = new THREE.BoxGeometry(e.case.lugWidthMm - 0.4, LENGTH, 1.3, 1, 40, 1).translate(0, tip + LENGTH / 2, z);
      layers.push({ geometry: bend(dir < 0 ? flipWinding(g.scale(1, dir, 1)) : g, WRIST_RADIUS, tip, dir), material: 'strap' });
    }
  }
  return layers;
}
