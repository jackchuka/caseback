import * as THREE from 'three';
import type { ExteriorLayer } from '../contract';
import { bend, flipWinding } from './bend';

export type BraceletSpec = {
  startWidth: number; endWidth: number; pitch: number; centerRatio: number; thickness: number;
  links: number; gap: number; wristRadius: number; centerRaise: number;
};

// A three-piece-link bracelet running from the 12 and 6 o'clock lugs toward the wrist. Links narrow evenly from the
// lugs to the far end; the centre piece stands a little proud, as on Oyster-type bracelets.
export function bracelet(s: BraceletSpec, start: { y: number; z: number }, material: { center: string; outer: string }): ExteriorLayer[] {
  const layers: ExteriorLayer[] = [];
  for (const dir of [1, -1] as const) {
    for (let i = 0; i < s.links; i++) {
      const w = s.startWidth + ((s.endWidth - s.startWidth) * i) / Math.max(1, s.links - 1);
      const cw = w * s.centerRatio;
      const ow = (w - cw) / 2 - s.gap;
      const len = s.pitch - s.gap;
      // Trailing gap per link, not split around it, so the first link's near edge sits exactly at start.y.
      const y = start.y + i * s.pitch + len / 2;
      const piece = (width: number, x: number, dz: number, name: string, mat: string) => {
        let g: THREE.BufferGeometry = new THREE.BoxGeometry(width, len, s.thickness, 2, 6, 1).translate(x, y, start.z + dz);
        if (dir < 0) g = flipWinding(g.scale(1, -1, 1));
        layers.push({ geometry: bend(g, s.wristRadius, start.y, dir), material: mat, name });
      };
      piece(ow, -(cw / 2 + s.gap + ow / 2), 0, 'bracelet-outer', material.outer);
      piece(cw, 0, -s.centerRaise, 'bracelet-center', material.center);
      piece(ow, cw / 2 + s.gap + ow / 2, 0, 'bracelet-outer', material.outer);
    }
  }
  return layers;
}
