import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import { atHour, dialDisc } from '../../../../src/scene/exterior/kit/dial';
import { S } from './params';

const LUME_HEIGHT = 0.12;
// The disc runs a little under the flange so no gap shows at its foot.
const DISC_RADIUS = S.dialRadius + 0.1;

// Where the date shows: the movement's own window over its date ring.
export const dateWindow = (m: MovementFrame) => ({ x: m.dateWindow!.x, y: 0, width: m.dateWindow!.width, height: m.dateWindow!.height });

// Gloss black with a date window at 3; the hour bars are thick lume standing on the dial, the minute track is printed.
// The printed text is left off.
export function sinnDial(m: MovementFrame): ExteriorLayer[] {
  const layers: ExteriorLayer[] = [{ geometry: dialDisc(DISC_RADIUS, m.dialZ, dateWindow(m)), material: 'dial' }];
  for (let h = 0; h < 12; h++) {
    const l = S.indexOuter - (h === 3 ? S.threeBarInner : S.hourBar.inner);
    const bar = new THREE.BoxGeometry(S.hourBar.width, l, LUME_HEIGHT).translate(0, l / 2, 0);
    layers.push({ geometry: atHour(bar, h, S.indexOuter, m.dialZ - LUME_HEIGHT / 2 - 0.005), material: 'dial-lume' });
  }
  return layers;
}

// Texture pixels per mm of dial, and the dial's centre in the texture.
const SIZE = 2048, PX = SIZE / (2 * DISC_RADIUS);

// The disc is turned to face the front (rotateX(π)), which already flips it vertically; no pre-mirror.
export function paintDial(m: MovementFrame) {
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
    // A thin white frame printed around the date window.
    const d = dateWindow(m), f = 0.12 * PX;
    g.strokeStyle = S.lume;
    g.lineWidth = f;
    g.strokeRect((d.x - d.width / 2) * PX - f / 2, -(d.height / 2) * PX - f / 2, d.width * PX + f, d.height * PX + f);
  }, 8);
}
