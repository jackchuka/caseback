import * as THREE from 'three';
import type { WatchExterior } from '../../model/watch';
import { dialTextureSpec } from './dial';

// Pre-mirrored vertically: the disc is seen from −Z, like the date ring.
// The dial disc is turned to face the front (rotateX(π)), which already flips it vertically; no pre-mirror.
export function paintDial(e: WatchExterior): THREE.CanvasTexture {
  const s = 2048;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
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
    g.font = `600 ${R * 0.14}px Inter, sans-serif`;
    g.fillText(n, Math.sin(a) * R * 0.72, -Math.cos(a) * R * 0.72);
    if (spec.ring24) {
      g.font = `500 ${R * 0.06}px Inter, sans-serif`;
      g.fillText(String(i === 0 ? 24 : i + 12), Math.sin(a) * R * 0.52, -Math.cos(a) * R * 0.52);
    }
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function paintInsert(e: WatchExterior): THREE.CanvasTexture {
  const s = 2048;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
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
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
