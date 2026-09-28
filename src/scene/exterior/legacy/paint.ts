import type { LegacyConfig } from './config';
import { canvasTexture } from '../kit/canvas';
import { dialTextureSpec } from './dial';

// Pre-mirrored vertically: the disc is seen from −Z, like the date ring.
// The dial disc is turned to face the front (rotateX(π)), which already flips it vertically; no pre-mirror.
export function paintDial(e: LegacyConfig) {
  return canvasTexture(2048, 2048, (g) => {
    const s = 2048;
    g.fillStyle = e.dial.color;
    g.fillRect(0, 0, s, s);
    if (e.dial.finish === 'sunburst') {
      for (let a = 0; a < Math.PI * 2; a += 0.003) {
        g.strokeStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.03})`;
        g.beginPath();
        g.moveTo(s / 2, s / 2);
        g.lineTo(s / 2 + Math.cos(a) * s, s / 2 + Math.sin(a) * s);
        g.stroke();
      }
    }
    g.translate(s / 2, s / 2);
    const spec = dialTextureSpec(e);
    g.fillStyle = e.dial.indexColor;
    g.strokeStyle = e.dial.indexColor;
    const R = s / 2;
    if (spec.minuteTrack) {
      for (let m = 0; m < 60; m++) {
        g.save();
        g.rotate((m / 60) * Math.PI * 2);
        const bar = e.dial.indices === 'bars-minute';
        const len = m % 5 === 0 ? (bar ? R * 0.16 : R * 0.05) : R * 0.025;
        const w = m % 5 === 0 ? (bar ? R * 0.035 : R * 0.012) : R * 0.008;
        g.fillRect(-w / 2, -R * 0.97, w, len);
        g.restore();
      }
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    spec.numerals.forEach((n, i) => {
      const a = (i / 12) * Math.PI * 2;
      if (spec.outerMinutes) {
        g.font = `500 ${R * 0.045}px Inter, sans-serif`;
        g.fillText(String(i === 0 ? 60 : i * 5), Math.sin(a) * R * 0.87, -Math.cos(a) * R * 0.87);
      }
      if (n === '') return;
      g.font = `600 ${R * 0.14}px Inter, sans-serif`;
      g.fillText(n, Math.sin(a) * R * 0.72, -Math.cos(a) * R * 0.72);
      if (spec.ring24) {
        g.font = `500 ${R * 0.06}px Inter, sans-serif`;
        g.fillText(String(i === 0 ? 24 : i + 12), Math.sin(a) * R * 0.52, -Math.cos(a) * R * 0.52);
      }
    });
  }, 8);
}

export function paintInsert(e: LegacyConfig) {
  return canvasTexture(2048, 2048, (g) => {
    const s = 2048;
    g.fillStyle = e.bezel.insertColor ?? '#222';
    g.fillRect(0, 0, s, s);
    g.translate(s / 2, s / 2);
    // The insert ring is turned to face the front (rotateX(π)), which already flips it vertically; no pre-mirror.
    g.fillStyle = '#f2f2f2';
    const R = s / 2;
    for (let m = 0; m < 60; m++) {
      g.save();
      g.rotate((m / 60) * Math.PI * 2);
      if (m === 0) {
        g.beginPath();
        g.moveTo(0, -R * 0.99);
        g.lineTo(R * 0.03, -R * 0.9);
        g.lineTo(-R * 0.03, -R * 0.9);
        g.fill();
      } else if (m % 10 === 0) {
        g.font = `600 ${R * 0.07}px Inter, sans-serif`;
        g.textAlign = 'center';
        g.fillText(String(m), 0, -R * 0.92);
      } else {
        g.fillRect(-R * 0.006, -R * 0.99, R * 0.012, m % 5 === 0 ? R * 0.06 : R * 0.03);
      }
      g.restore();
    }
  });
}

// Leather with contrast stitching along both edges; mapped onto the strap's faces (UV x across, y along).
export function paintStrap(e: LegacyConfig) {
  return canvasTexture(256, 1024, (g) => {
    const w = 256;
    const h = 1024;
    g.fillStyle = e.strap.color;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    g.strokeStyle = '#efe6d2';
    g.lineWidth = 5;
    g.setLineDash([22, 14]);
    for (const x of [w * 0.1, w * 0.9]) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, h);
      g.stroke();
    }
  });
}
