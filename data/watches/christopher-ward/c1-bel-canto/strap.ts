import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { boxStrap } from '../../../../src/scene/exterior/kit/bend';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import { caseShape } from './case';
import { P } from './params';

const S = P.strap;
// Box face groups in BoxGeometry order: +X, −X, +Y, −Y, +Z (the lining, toward the wrist), −Z (the top).
const FACES = ['strap-edge', 'strap-edge', 'strap-edge', 'strap-edge', 'strap-lining', 'strap'];

// Where the strap starts: its end tucks under the lug tips, wrapped round the spring bar.
export function strapStart(m: MovementFrame) {
  const s = caseShape(m);
  return { y: s.hole.y - S.tuck, z: s.hole.z };
}

// The two halves of the navy leather strap: 22 mm at the lugs, tapering toward the buckle, with tonal blue stitching
// (drawn on the top face's texture) round the edges and across near the lug end.
export function belCantoStrap(m: MovementFrame): ExteriorLayer[] {
  return boxStrap(S, strapStart(m), [4, 60]).map((geometry) => ({ geometry, material: FACES, name: 'strap' }));
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
    g.fillStyle = P.strapColor;
    g.fillRect(0, 0, w, h);
    // A little grain so the leather doesn't read as paint; seeded, so compare screenshots repeat exactly.
    const rand = mulberry32(0x243044);
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = `rgba(${rand() < 0.5 ? '0,0,0' : '190,205,230'},0.05)`;
      g.fillRect(rand() * w, rand() * h, 3, 3);
    }
    const inset = (S.stitchInset / S.width) * w;
    const across = (S.stitchFromEnd / S.length) * h;
    g.strokeStyle = P.stitchColor;
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
