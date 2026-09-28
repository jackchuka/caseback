import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import { crystal } from '../../../../src/scene/exterior/kit/crystal';
import { cutFlutes } from '../../../../src/scene/exterior/kit/flutes';
import { crease, flange, lathe } from '../../../../src/scene/exterior/kit/lathe';
import { bezelTop, caseFront, crystalTop } from './case';
import { P } from './params';

export type BezelMark = { minute: number; kind: 'triangle' | 'tick' | 'dot' | 'numeral'; text?: string; upright?: boolean };

// The pilot's countdown scale: a lume triangle at 12, the fives as numerals running counter-clockwise (5 at 11
// o'clock) each with a dot on its inner side, a tick at every other minute. Numerals stand with their tops to the
// rim, except the three round 6 o'clock, which turn to read upright, as in the front photo.
export function bezelMarks(): BezelMark[] {
  return Array.from({ length: 60 }, (_, i): BezelMark[] => {
    // i counts minutes clockwise from 12; the printed value counts the other way.
    const value = (60 - i) % 60;
    if (i === 0) return [{ minute: i, kind: 'triangle' }];
    if (value % 5 === 0) return [{ minute: i, kind: 'dot' }, { minute: i, kind: 'numeral', text: String(value), upright: i >= 25 && i <= 35 }];
    return [{ minute: i, kind: 'tick' }];
  }).flat();
}

// The rotating bezel: a coin-edged wall, a flat black insert, a polished lip sloping down to the domed crystal, and
// the rehaut from the dial's edge up to the crystal's seat.
export function sinnBezel(m: MovementFrame): ExteriorLayer[] {
  const b = caseFront(m);
  const top = bezelTop(m);
  const lip = top + P.bezelLipDrop;
  const body = lathe([
    [P.crystalRadius, b - 0.02], ...crease([P.crystalRadius, lip + 0.35]), ...crease([P.innerRing, lip]), ...crease([P.insertInner - 0.05, top]),
    [P.insertInner - 0.05, top + 0.12], [P.insertOuter + 0.05, top + 0.12], ...crease([P.insertOuter + 0.05, top]),
    [P.bezelOuter - 0.25, top], [P.bezelOuter, top + 0.3],
    // The coin edge needs rings along its wall for the flutes to cut.
    ...Array.from({ length: 7 }, (_, i): [number, number] => [P.bezelOuter, top + 0.4 + ((b - 0.2 - (top + 0.4)) * i) / 6]),
    [P.bezelOuter, b - 0.1], [P.bezelOuter - 0.3, b - 0.02], [P.crystalRadius, b - 0.02],
  ], P.knurlCount * 4);
  cutFlutes(body, { axis: 'z', radius: P.bezelOuter, count: P.knurlCount, depth: P.knurlDepth, from: top + 0.4, to: b - 0.2 });
  const insert = new THREE.RingGeometry(P.insertInner, P.insertOuter, 360, 2).rotateX(Math.PI).translate(0, 0, top + 0.11);
  return [
    { geometry: body, material: 'bezel' },
    { geometry: insert, material: 'insert' },
    { geometry: flange([P.dialRadius, m.dialZ - 0.01], [P.crystalRadius, lip + 0.35]), material: 'flange', name: 'flange' },
  ];
}

// High-domed sapphire, its edge in the bezel's lip and its apex at the measured height.
export function sinnCrystal(m: MovementFrame): ExteriorLayer[] {
  const rim = bezelTop(m) + P.bezelLipDrop;
  return crystal({ radius: P.crystalRadius - 0.02, rim, dome: rim - crystalTop(m), foot: rim + 0.3 });
}

// The insert ring is turned to face the front (rotateX(π)), which already flips it vertically; no pre-mirror.
export function paintInsert() {
  return canvasTexture(2048, 2048, (g) => {
    const s = 2048, R = s / 2;
    const inner = (P.insertInner / P.insertOuter) * R;
    const band = R - inner;
    const px = R / P.insertOuter;
    g.fillStyle = '#0b0b0c';
    g.fillRect(0, 0, s, s);
    g.translate(R, R);
    g.fillStyle = P.print;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const mark of bezelMarks()) {
      g.save();
      g.rotate((mark.minute / 60) * Math.PI * 2);
      if (mark.kind === 'triangle') {
        g.fillStyle = P.lume;
        g.beginPath();
        g.moveTo(0, -inner - band * 0.12);
        g.lineTo(1.05 * px, -R * 0.985);
        g.lineTo(-1.05 * px, -R * 0.985);
        g.fill();
      } else if (mark.kind === 'tick') g.fillRect(-0.11 * px, -inner - 1.05 * px, 0.22 * px, 0.9 * px);
      else if (mark.kind === 'dot') g.fillRect(-0.3 * px, -inner - 0.95 * px, 0.6 * px, 0.6 * px);
      else {
        g.font = `500 ${1.55 * px}px Inter, sans-serif`;
        g.translate(0, -(P.insertOuter - 1.25) * px);
        if (mark.upright) g.rotate(Math.PI);
        g.fillText(mark.text!, 0, 0);
      }
      g.restore();
    }
  }, 8);
}
