import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { bend, flipWinding } from '../../../../src/scene/exterior/kit/bend';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import { caseShape } from './case';
import { H } from './params';

const S = H.strap;
// Box face groups in BoxGeometry order: +X, −X, +Y, −Y, +Z (the lining, toward the wrist), −Z (the top).
const FACES = ['strap-edge', 'strap-edge', 'strap-edge', 'strap-edge', 'strap-lining', 'strap'];

// Where the strap starts: its end tucks under the lug tips, wrapped round the spring bar.
export function strapStart(m: MovementFrame) {
  const s = caseShape(m);
  return { y: s.hole.y - S.tuck, z: s.hole.z };
}

// Narrows from the lugs to the buckle end and thins from the padded lug end, both over the strap's length.
function taper(g: THREE.BufferGeometry, start: number, z: number) {
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, Math.max(0, (p.getY(i) - start) / S.length));
    p.setX(i, p.getX(i) * (1 - (1 - S.endWidth / S.width) * t));
    p.setZ(i, z + (p.getZ(i) - z) * (1 - (1 - S.endThickness / S.thickness) * t));
  }
  p.needsUpdate = true;
  return g;
}

// The two halves of the brown leather strap: tapered 20 → 18 mm, padded at the lugs, cream-lined, with cream
// stitching (drawn on the top face's texture) running round the edges and across near the lug end.
export function hamiltonStrap(m: MovementFrame): ExteriorLayer[] {
  const { y, z } = strapStart(m);
  return ([1, -1] as const).map((dir) => {
    const box = new THREE.BoxGeometry(S.width, S.length, S.thickness, 4, 60, 1).translate(0, y + S.length / 2, z);
    const g = taper(box, y, z);
    const placed = dir < 0 ? flipWinding(g.scale(1, -1, 1)) : g;
    return { geometry: bend(placed, S.wristRadius, y + S.straight, dir), material: FACES, name: 'strap' };
  });
}

// A small seeded PRNG (mulberry32).
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The top face's UVs span the strap: u across (0..1), v along it from the lug end (0) to the free end (1).
export function paintStrap() {
  const w = 256, h = 2048;
  return canvasTexture(w, h, (g) => {
    g.fillStyle = H.strapColor;
    g.fillRect(0, 0, w, h);
    // A little mottling so the leather doesn't read as paint; seeded, so compare screenshots repeat exactly.
    const rand = mulberry32(0x6b4226);
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = `rgba(${rand() < 0.5 ? '0,0,0' : '255,220,190'},0.05)`;
      g.fillRect(rand() * w, rand() * h, 3, 3);
    }
    const inset = (S.stitchInset / S.width) * w;
    const across = (S.stitchFromEnd / S.length) * h;
    g.strokeStyle = H.stitchColor;
    g.lineWidth = 5;
    g.setLineDash([22, 12]);
    g.beginPath();
    // v = 0 is the canvas bottom (flipY), where the lug end is.
    g.moveTo(inset, 0);
    g.lineTo(inset, h - across);
    g.lineTo(w - inset, h - across);
    g.lineTo(w - inset, 0);
    g.stroke();
  }, 8);
}
