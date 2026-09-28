import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import { atHour, dialDisc } from '../../../../src/scene/exterior/kit/dial';
import { P } from './params';

// A faceted dagger lying along −Y from its outer end (origin) toward the centre, its two facets meeting in a ridge
// along its axis; the facets face −Z (the viewer). Non-indexed, so every facet shades flat like a cut surface.
export function dagger(length: number, width: number, height: number): THREE.BufferGeometry {
  const w = width / 2, base = 0.05;
  const L: [number, number, number] = [-w, 0, -base], Rt: [number, number, number] = [w, 0, -base], T: [number, number, number] = [0, length, -base];
  const M: [number, number, number] = [0, 0, -height], Mt: [number, number, number] = [0, length * 0.92, -base - 0.04];
  const low = (p: [number, number, number]): [number, number, number] => [p[0], p[1], 0];
  const tris: Array<[number, number, number]> = [
    // Two facets up to the ridge, and the outer end's face.
    L, M, T, M, Mt, T, M, Rt, T, Mt, M, T,
    Rt, M, L,
    // Side walls down to the dial.
    low(L), L, T, low(L), T, low(T), Rt, low(Rt), low(T), Rt, low(T), T, low(L), low(Rt), Rt, low(L), Rt, L,
  ];
  // Listed clockwise as seen from outside; reversed here so every face winds counter-clockwise (outward).
  const ccw = tris.flatMap((_, i) => (i % 3 === 0 ? [tris[i]!, tris[i + 2]!, tris[i + 1]!] : []));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(ccw.flat(), 3));
  g.computeVertexNormals();
  return g;
}

// A rectangular frame (outer w×h, band b) of height `height`, facing −Z.
function frameRing(w: number, h: number, band: number, height: number) {
  const s = new THREE.Shape([new THREE.Vector2(-w / 2, -h / 2), new THREE.Vector2(w / 2, -h / 2), new THREE.Vector2(w / 2, h / 2), new THREE.Vector2(-w / 2, h / 2)]);
  const iw = w / 2 - band, ih = h / 2 - band;
  s.holes.push(new THREE.Path([new THREE.Vector2(-iw, -ih), new THREE.Vector2(-iw, ih), new THREE.Vector2(iw, ih), new THREE.Vector2(iw, -ih)]));
  return new THREE.ExtrudeGeometry(s, { depth: height, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 }).translate(0, 0, -height);
}

// The pressed sunray dial with its date window at 3, twelve applied faceted daggers (the 3 o'clock one cut short
// outside the window) and a polished frame round the window. The printed name and text are left off.
export function presageDial(m: MovementFrame): ExteriorLayer[] {
  const rad = P.dialRadius;
  const win = m.dateWindow!;
  const face = m.dialZ - 0.2;
  const layers: ExteriorLayer[] = [{ geometry: dialDisc(rad, face, { x: win.x, y: 0, width: win.width, height: win.height }), material: 'dial' }];
  const I = P.index;
  for (let h = 0; h < 12; h++) {
    const length = (h === 3 ? P.index3 : I.length) * rad;
    layers.push({ geometry: atHour(dagger(length, I.width, I.height), h, I.outer * rad, face), material: 'index', name: 'index' });
  }
  const fw = win.width + 2 * P.windowFrame, fh = win.height + 2 * P.windowFrame;
  layers.push({ geometry: frameRing(fw, fh, P.windowFrame, 0.18).translate(win.x, 0, face), material: 'index', name: 'date-frame' });
  return layers;
}

// Radial rays pressed into a pale blue-silver face, a fine concentric grain, and the printed minute track.
export function paintDial() {
  return canvasTexture(2048, 2048, (g) => {
    const S = 2048, R = S / 2;
    const grad = g.createRadialGradient(R, R, 0, R, R, R);
    grad.addColorStop(0, '#e2ecf6');
    grad.addColorStop(0.6, P.dialColor);
    grad.addColorStop(1, '#a9bfd6');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
    g.translate(R, R);
    for (let i = 0; i < 720; i++) {
      g.save();
      g.rotate((i / 720) * Math.PI * 2);
      g.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(70,95,125,0.22)';
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(-R * 0.0044, -R);
      g.lineTo(R * 0.0044, -R);
      g.fill();
      g.restore();
    }
    g.strokeStyle = 'rgba(255,255,255,0.12)';
    g.lineWidth = 1;
    for (let r = 6; r < R; r += 6) {
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = '#1d232b';
    for (let i = 0; i < 300; i++) {
      g.save();
      g.rotate((i / 300) * Math.PI * 2);
      const minute = i % 5 === 0;
      const band = R * (P.trackOuter - P.trackInner);
      g.fillRect(-R * (minute ? 0.0024 : 0.0014), -R * P.trackOuter, R * (minute ? 0.0048 : 0.0028), band * (minute ? 1 : 0.55));
      g.restore();
    }
  }, 8);
}
