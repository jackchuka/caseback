import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import { atHour } from '../../../../src/scene/exterior/kit/dial';
import { P } from './params';

const LUME_HEIGHT = 0.1;
// The printed frame floats this far in front of the disc, so it never fights it for depth.
const PRINT = 0.005;
// The disc runs a little under the rehaut so no gap shows at its foot.
const DISC_RADIUS = P.dialRadius + 0.1;
const W = P.window;

// The day and date openings at 3 o'clock, in watch coordinates (12 o'clock toward −Y).
export const openings = () => [W.day, W.date].map(([x0, x1]) => ({ x0, x1, y0: -W.halfHeight, y1: W.halfHeight }));

const rect = (x0: number, y0: number, x1: number, y1: number) => new THREE.Path([new THREE.Vector2(x0, y0), new THREE.Vector2(x0, y1), new THREE.Vector2(x1, y1), new THREE.Vector2(x1, y0)]);

// The matte black dial, cut for the day and date; the white frame round both openings; the hour markers as lume
// standing on the dial. Numerals, minute track and the sub-dials' scales are printed. The name and "Automatik" are
// left off.
export function sinnDial(m: MovementFrame): ExteriorLayer[] {
  const face = m.dialZ - 0.2;
  const s = new THREE.Shape().absarc(0, 0, DISC_RADIUS, 0, Math.PI * 2, false);
  // Built before the turn to the front, which flips y.
  for (const o of openings()) s.holes.push(rect(o.x0, -o.y1, o.x1, -o.y0));
  const disc = new THREE.ShapeGeometry(s, 64);
  const pos = disc.getAttribute('position'), uv = disc.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (2 * DISC_RADIUS) + 0.5, pos.getY(i) / (2 * DISC_RADIUS) + 0.5);
  const layers: ExteriorLayer[] = [{ geometry: disc.rotateX(Math.PI).translate(0, 0, face), material: 'dial' }];

  const [day, date] = openings();
  const f = W.frame;
  const frame = new THREE.Shape([new THREE.Vector2(day!.x0 - f, day!.y0 - f), new THREE.Vector2(date!.x1 + f, day!.y0 - f), new THREE.Vector2(date!.x1 + f, day!.y1 + f), new THREE.Vector2(day!.x0 - f, day!.y1 + f)]);
  for (const o of openings()) frame.holes.push(rect(o.x0, o.y0, o.x1, o.y1));
  layers.push({ geometry: new THREE.ShapeGeometry(frame).rotateX(Math.PI).translate(0, 0, face - PRINT), material: 'print', name: 'date-frame' });

  const M = P.marker;
  for (let h = 0; h < 12; h++) {
    const bar = new THREE.BoxGeometry(M.width, M.length, LUME_HEIGHT).translate(0, M.length / 2, 0);
    layers.push({ geometry: atHour(bar, h, M.radius + M.length / 2, face - LUME_HEIGHT / 2 - 0.005), material: 'dial-lume' });
  }
  return layers;
}

// Texture pixels per mm of dial.
const SIZE = 2048, PX = SIZE / (2 * DISC_RADIUS);

// The disc is turned to face the front (rotateX(π)), which already flips it vertically; no pre-mirror.
export function paintDial() {
  return canvasTexture(SIZE, SIZE, (g) => {
    g.fillStyle = '#0a0a0b';
    g.fillRect(0, 0, SIZE, SIZE);
    g.translate(SIZE / 2, SIZE / 2);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const T = P.minuteTick;
    g.fillStyle = P.print;
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue;
      g.save();
      g.rotate((i / 60) * Math.PI * 2);
      g.fillRect((-T.width / 2) * PX, -T.outer * PX, T.width * PX, (T.outer - T.inner) * PX);
      g.restore();
    }
    // Lume numerals: every hour but those the sub-dials and the window take.
    g.fillStyle = P.lume;
    g.font = `600 ${P.numeral.height * 1.38 * PX}px Inter, sans-serif`;
    for (const h of [1, 2, 4, 5, 7, 8, 10, 11]) {
      const a = (h / 12) * Math.PI * 2;
      g.fillText(String(h), Math.sin(a) * P.numeral.radius * PX, -Math.cos(a) * P.numeral.radius * PX);
    }
    // Sub-dials: a minute counter to 30 at 12, the running seconds to 60 at 9, the hour counter to 12 at 6.
    const S = P.subdial;
    const scale: Record<string, { steps: number; major: number; labels: Array<[number, string]> }> = {
      'minute-counter-hand': { steps: 30, major: 5, labels: [[10, '10'], [20, '20'], [30, '30']] },
      'seconds-hand': { steps: 60, major: 5, labels: [[20, '20'], [40, '40'], [60, '60']] },
      'hour-counter-hand': { steps: 48, major: 4, labels: Array.from({ length: 12 }, (_, i): [number, string] => [(i + 1) * 4, String(i + 1)]) },
    };
    g.fillStyle = P.print;
    for (const d of P.subdials) {
      const sc = scale[d.id]!;
      g.save();
      g.translate(d.x * PX, d.y * PX);
      for (let i = 0; i < sc.steps; i++) {
        g.save();
        g.rotate((i / sc.steps) * Math.PI * 2);
        const major = i % sc.major === 0;
        const len = (major ? S.tickLength * 1.4 : S.tickLength) * PX;
        const w = (major ? 0.2 : 0.12) * PX;
        g.fillRect(-w / 2, -S.outer * PX, w, len);
        g.restore();
      }
      const small = sc.labels.length > 3;
      g.font = `500 ${(small ? S.numeralHeight * 0.8 : S.numeralHeight) * 1.38 * PX}px Inter, sans-serif`;
      for (const [at, text] of sc.labels) {
        const a = (at / sc.steps) * Math.PI * 2;
        const r = (small ? S.numeral + 0.2 : S.numeral) * PX;
        g.fillText(text, Math.sin(a) * r, -Math.cos(a) * r);
      }
      g.restore();
    }
  }, 8);
}
