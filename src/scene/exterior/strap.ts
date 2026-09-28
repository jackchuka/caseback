import * as THREE from 'three';
import type { WatchExterior } from '../../model/watch';
import type { Layer } from '../../geometry/parts';
import type { CaseRadii } from '../caseGeometry';
import { bend, flipWinding } from './bend';
import { lugTipZ } from './lugs';

const WRIST_RADIUS = 26;
const LENGTH = 38;
const TAPER = 0.25; // straps narrow by a quarter from the lugs to the buckle end

function taper(g: THREE.BufferGeometry, start: number) {
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, Math.max(0, (p.getY(i) - start) / LENGTH));
    p.setX(i, p.getX(i) * (1 - TAPER * t));
  }
  p.needsUpdate = true;
  return g;
}

export function strap(e: WatchExterior, r: CaseRadii): Layer[] {
  const tip = e.case.lugToLugMm / 2 - 1.3;
  // The strap hangs from the lug tips, which sweep down toward the wrist.
  const z = lugTipZ(r);
  const layers: Layer[] = [];
  for (const dir of [1, -1] as const) {
    if (e.strap.kind === 'bracelet') {
      const links = 14;
      for (let i = 0; i < links; i++) {
        const g = taper(new THREE.BoxGeometry(e.case.lugWidthMm - 0.4, LENGTH / links - 0.25, 2.0, 2, 2, 1).translate(0, tip + (i + 0.5) * (LENGTH / links), z), tip);
        layers.push({ geometry: bend(dir < 0 ? flipWinding(g.scale(1, dir, 1)) : g, WRIST_RADIUS, tip, dir), material: 'strap' });
      }
    } else {
      const g = taper(new THREE.BoxGeometry(e.case.lugWidthMm - 0.4, LENGTH, 1.8, 1, 40, 1).translate(0, tip + LENGTH / 2, z), tip);
      layers.push({ geometry: bend(dir < 0 ? flipWinding(g.scale(1, dir, 1)) : g, WRIST_RADIUS, tip, dir), material: 'strap' });
    }
  }
  return layers;
}
