import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import { atHour, dateWindowOf, dialDisc, windowFrame } from '../../../../src/scene/exterior/kit/dial';
import { S } from './params';

const LUME_HEIGHT = 0.12;
// The printed white frame around the date window: its width, and how far it floats in front of the disc.
const FRAME = 0.12, PRINT = 0.005;
// The disc runs a little under the flange so no gap shows at its foot.
const DISC_RADIUS = S.dialRadius + 0.1;

// Gloss black with a framed date window at 3; the hour bars are thick lume standing on the dial, the minute track is
// printed.
// The printed text is left off.
export function sinnDial(m: MovementFrame): ExteriorLayer[] {
  const d = dateWindowOf(m);
  const layers: ExteriorLayer[] = [{ geometry: dialDisc(DISC_RADIUS, m.dialZ, d), material: 'dial' }];
  layers.push({ geometry: new THREE.ShapeGeometry(windowFrame(d, FRAME)).rotateX(Math.PI).translate(0, 0, m.dialZ - PRINT), material: 'dial-lume', name: 'date-frame' });
  for (let h = 0; h < 12; h++) {
    const l = S.indexOuter - (h === 3 ? S.threeBarInner : S.hourBar.inner);
    const bar = new THREE.BoxGeometry(S.hourBar.width, l, LUME_HEIGHT).translate(0, l / 2, 0);
    layers.push({ geometry: atHour(bar, h, S.indexOuter, m.dialZ - LUME_HEIGHT / 2 - 0.005), material: 'dial-lume' });
  }
  return layers;
}

// Texture pixels per mm of dial.
const SIZE = 2048, PX = SIZE / (2 * DISC_RADIUS);

// The disc is turned to face the front (rotateX(π)), which already flips it vertically; no pre-mirror.
export function paintDial() {
  return canvasTexture(SIZE, SIZE, (g) => {
    g.fillStyle = '#060607';
    g.fillRect(0, 0, SIZE, SIZE);
    g.translate(SIZE / 2, SIZE / 2);
    g.fillStyle = S.lume;
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue;
      g.save();
      g.rotate((i / 60) * Math.PI * 2);
      const w = S.minuteTick.width * PX;
      g.fillRect(-w / 2, -S.indexOuter * PX, w, (S.indexOuter - S.minuteTick.inner) * PX);
      g.restore();
    }
  }, 8);
}
