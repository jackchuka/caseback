import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import { dateWindowOf } from '../../../../src/scene/exterior/kit/dial';
import { H } from './params';

const rect = (p: THREE.Path, cx: number, w: number, h: number, ccw: boolean) => {
  const pts: Array<[number, number]> = [[cx - w / 2, -h / 2], [cx + w / 2, -h / 2], [cx + w / 2, h / 2], [cx - w / 2, h / 2]];
  const ordered = ccw ? pts : [...pts].reverse();
  p.moveTo(...ordered[0]!);
  for (const q of ordered.slice(1)) p.lineTo(...q);
  p.closePath();
  return p;
};

// Silver three-zone dial with the design's printed scales (minute track, hours, 24 h) and no text, a framed date
// window at 3 o'clock and twelve lume dots on the minute track.
export function hamiltonDial(m: MovementFrame): ExteriorLayer[] {
  const rad = H.dialRadius;
  const win = dateWindowOf(m);
  const s = new THREE.Shape();
  s.absarc(0, 0, rad, 0, Math.PI * 2, false);
  s.holes.push(rect(new THREE.Path(), win.x, win.width, win.height, false));
  const disc = new THREE.ShapeGeometry(s, 96);
  const pos = disc.getAttribute('position');
  const uv = disc.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (2 * rad) + 0.5, pos.getY(i) / (2 * rad) + 0.5);
  disc.rotateX(Math.PI).translate(0, 0, m.dialZ);
  const layers: ExteriorLayer[] = [{ geometry: disc, material: 'dial', name: 'dial' }];

  const b = H.dateFrame;
  const frame = rect(new THREE.Shape(), win.x, win.width + 2 * b, win.height + 2 * b, true) as THREE.Shape;
  frame.holes.push(rect(new THREE.Path(), win.x, win.width, win.height, false));
  const bt = H.dateFrameHeight / 3;
  // Built with its top toward +Z, so after the turn to face the front its bevelled face stands off the dial.
  const frameGeo = new THREE.ExtrudeGeometry(frame, { depth: bt, bevelEnabled: true, bevelThickness: bt, bevelSize: bt, bevelOffset: -bt, bevelSegments: 2 })
    .rotateX(Math.PI).translate(0, 0, m.dialZ - 0.01 - bt);
  layers.push({ geometry: frameGeo, material: 'flange', name: 'date-frame' });

  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2;
    const dot = new THREE.CylinderGeometry(H.lumeDot, H.lumeDot, 0.06, 24).rotateX(Math.PI / 2)
      .translate(Math.sin(a) * H.lumeDotAt, -Math.cos(a) * H.lumeDotAt, m.dialZ - 0.03);
    layers.push({ geometry: dot, material: 'dial-lume' });
  }
  return layers;
}

// What the dial prints, from the photos: the 3 gives way to the date window; the 24 h ring runs 13–24 with 24 at
// the top; the minute track numbers every five minutes, 5–60.
export function dialPrint() {
  return {
    hours: Array.from({ length: 12 }, (_, i) => (i === 3 ? '' : String(i === 0 ? 12 : i))),
    day: Array.from({ length: 12 }, (_, i) => String(i === 0 ? 24 : i + 12)),
    minutes: Array.from({ length: 12 }, (_, i) => String(i === 0 ? 60 : i * 5)),
  };
}

const INK = '#2b3136';

// The disc is turned to face the front (rotateX(π)), which already flips it vertically; no pre-mirror.
export function paintDial() {
  const size = 2048;
  return canvasTexture(size, size, (g) => {
    const R = size / 2;
    const k = R / H.dialRadius;
    const Z = H.dialZones;
    g.fillStyle = Z.track;
    g.fillRect(0, 0, size, size);
    g.translate(R, R);
    const disc = (r: number, fill: string) => { g.beginPath(); g.arc(0, 0, r * k, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); };
    // Minute track: grained; hour ring: lighter, turned in fine circles; centre: sunray.
    disc(H.dialRadius, Z.track);
    disc(H.trackInner, Z.ring);
    g.strokeStyle = 'rgba(255,255,255,0.10)';
    g.lineWidth = 1.5;
    for (let r = H.hourInner; r < H.trackInner; r += 0.09) { g.beginPath(); g.arc(0, 0, r * k, 0, Math.PI * 2); g.stroke(); }
    disc(H.hourInner, Z.centre);
    for (let i = 0; i < 720; i++) {
      const a = (i / 720) * Math.PI * 2;
      g.strokeStyle = `rgba(255,255,255,${0.04 + 0.05 * Math.abs(Math.sin(a * 2))})`;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * H.hourInner * k, Math.sin(a) * H.hourInner * k); g.stroke();
    }
    g.fillStyle = INK;
    // Ticks: a long one at every minute across the track, four short fifths on its outer half; at the fives the
    // numeral and the lume dot take the long tick's place.
    for (let i = 0; i < 300; i++) {
      const minute = i / 5;
      const five = i % 25 === 0;
      const whole = i % 5 === 0;
      if (five) continue;
      g.save();
      g.rotate((minute / 60) * Math.PI * 2);
      const w = whole ? 0.1 : 0.08, from = whole ? H.longTickFrom : H.shortTickFrom;
      // Fifths either side of a five sit clear of its lume dot.
      if (!whole && Math.abs(((i + 12) % 25) - 12) < 2) { g.restore(); continue; }
      g.fillRect((-w / 2) * k, -H.tickOuter * k, w * k, (H.tickOuter - from) * k);
      g.restore();
    }
    g.textBaseline = 'middle';
    const print = dialPrint();
    // Hamilton's hour figures draw the 1 as a plain bar (the 11 reads as two bars); other digits come from the font.
    const write = (t: string, px: number, bars: boolean) => {
      const bar = { w: px * 0.16, gap: px * 0.12 };
      const widths = [...t].map((c) => (bars && c === '1' ? bar.w + bar.gap : g.measureText(c).width));
      let x = -widths.reduce((a, b) => a + b, 0) / 2;
      [...t].forEach((c, i) => {
        if (bars && c === '1') g.fillRect(x + bar.gap / 2, -px * 0.36, bar.w, px * 0.72);
        else { g.textAlign = 'left'; g.fillText(c, x, 0); }
        x += widths[i]!;
      });
    };
    const ring = (texts: string[], at: number, height: number, weight: number, radial: boolean, bars = false) => {
      const px = height * k * 1.36;
      g.font = `${weight} ${px}px "Helvetica Neue", Arial, sans-serif`;
      texts.forEach((t, i) => {
        if (!t) return;
        const a = (i / 12) * Math.PI * 2;
        g.save();
        if (radial) {
          // Along the track, bottoms toward the centre, as printed.
          g.rotate(a);
          g.translate(0, -at * k);
          if (i > 3 && i < 9) g.rotate(Math.PI);
        } else g.translate(Math.sin(a) * at * k, -Math.cos(a) * at * k);
        write(t, px, bars);
        g.restore();
      });
    };
    ring(print.minutes, H.minuteNumeralAt, H.minuteNumeral, 600, true);
    ring(print.hours, H.hourNumeralAt, H.hourNumeral, 700, false, true);
    ring(print.day, H.dayNumeralAt, H.dayNumeral, 600, false);
  }, 8);
}

// The dial's brushing as an anisotropy map (RG: direction in the disc's UV frame, B: strength). The sunray centre is
// brushed along the radii, so its sheen stretches round the circle; the hour ring is turned in circles, so its sheen
// runs along the radii; the grained track barely stretches it.
export function paintDialGrain() {
  const size = 512;
  const t = canvasTexture(size, size, (g) => {
    const img = g.createImageData(size, size);
    const k = size / (2 * H.dialRadius);
    for (let py = 0; py < size; py++)
      for (let px = 0; px < size; px++) {
        const x = (px + 0.5) / k - H.dialRadius, y = (py + 0.5) / k - H.dialRadius;
        const r = Math.hypot(x, y) || 1;
        const [ux, uy] = [x / r, y / r];
        // Canvas rows run down the texture; UV v runs up.
        const [dx, dy, strength] = r < H.hourInner ? [-uy, ux, 0.9] : r < H.trackInner ? [ux, uy, 0.7] : [ux, uy, 0.15];
        const i = (py * size + px) * 4;
        img.data[i] = Math.round((dx * 0.5 + 0.5) * 255);
        img.data[i + 1] = Math.round((-dy * 0.5 + 0.5) * 255);
        img.data[i + 2] = Math.round(strength * 255);
        img.data[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
  });
  t.colorSpace = THREE.NoColorSpace;
  return t;
}
