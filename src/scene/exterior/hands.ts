import * as THREE from 'three';
import type { WatchExterior } from '../../model/watch';
import type { Layer, MovementMaterial } from '../../geometry/parts';

type P = [number, number];
type Outline = { frame: P[]; lume: P[] | null };

// Proportions read off the reference photos, as fractions of the dial radius: the hour hand reaches the inner edge
// of the numerals, the minute hand the minute track, the seconds hand just short of the dial edge.
const HOUR = 0.62;
const MINUTE = 0.9;
const SECONDS = 0.94;
const SECONDS_TAIL = 0.26;
const WIDTH = { syringe: [1.7, 1.3], sword: [1.9, 1.5], pencil: [1.8, 1.4], baton: [1.5, 1.2] } as const;
const FRAME = 0.28;
// Short, narrow counter-tails; full-width tails read as a dark cross over the pivot.
const TAIL = 1.8;
const NECK = 0.35;

// Hands point to −Y (12 o'clock) and pivot at the origin.
function outline(style: keyof typeof WIDTH, L: number, w: number): Outline {
  const h = w / 2;
  const f = FRAME;
  switch (style) {
    case 'syringe':
      // Thin shaft, a lume-filled barrel, then a needle point.
      return {
        frame: [[-NECK, TAIL], [NECK, TAIL], [NECK, -0.18 * L], [h, -0.22 * L], [h, -0.8 * L], [0.12, -0.86 * L], [0, -L], [-0.12, -0.86 * L], [-h, -0.8 * L], [-h, -0.22 * L], [-NECK, -0.18 * L]],
        lume: [[h - f, -0.22 * L - f], [h - f, -0.8 * L + f * 0.5], [-(h - f), -0.8 * L + f * 0.5], [-(h - f), -0.22 * L - f]],
      };
    case 'sword':
      return {
        frame: [[-NECK, TAIL], [NECK, TAIL], [h, -0.18 * L], [0, -L], [-h, -0.18 * L]],
        lume: [[h - f, -0.2 * L], [0, -L + 3 * f], [-(h - f), -0.2 * L], [0, -0.12 * L]],
      };
    case 'pencil':
      return {
        frame: [[-NECK, TAIL], [NECK, TAIL], [NECK, 0], [h, -0.08 * L], [h, -0.86 * L], [0, -L], [-h, -0.86 * L], [-h, -0.08 * L], [-NECK, 0]],
        lume: [[h - f, -0.14 * L], [h - f, -0.85 * L], [0, -L + 3 * f], [-(h - f), -0.85 * L], [-(h - f), -0.14 * L]],
      };
    case 'baton':
      return {
        frame: [[-NECK, TAIL], [NECK, TAIL], [NECK, 0], [h, -0.08 * L], [h, -L], [-h, -L], [-h, -0.08 * L], [-NECK, 0]],
        lume: [[h - f, -0.16 * L], [h - f, -L + f], [-(h - f), -L + f], [-(h - f), -0.16 * L]],
      };
  }
}

function plate(pts: P[], thickness: number, z: number) {
  const s = new THREE.Shape();
  pts.forEach(([x, y], k) => (k === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  // Lume sits on the front (−Z) face of the frame.
  return new THREE.ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false }).translate(0, 0, z - thickness);
}

const hub = (r: number, z: number) => new THREE.CylinderGeometry(r, r, 0.2, 40).rotateX(Math.PI / 2).translate(0, 0, z);

export type HandLayers = { hour: Layer[]; minute: Layer[]; seconds: Layer[] };

export function frameMaterial(e: WatchExterior): MovementMaterial {
  return ({ white: 'lume', silver: 'steel', blued: 'blued' } as const)[e.hands.color];
}

export function watchHands(e: WatchExterior, dialRadius: number): HandLayers {
  const metal = frameMaterial(e);
  const [hw, mw] = WIDTH[e.hands.style];
  const one = (L: number, w: number): Layer[] => {
    const o = outline(e.hands.style, L, w);
    const layers: Layer[] = [{ geometry: plate(o.frame, 0.12, 0), material: metal }, { geometry: hub(w * 0.55, -0.1), material: metal }];
    if (o.lume) layers.push({ geometry: plate(o.lume, 0.08, -0.12), material: 'lume' });
    return layers;
  };
  const sL = SECONDS * dialRadius;
  const tail = SECONDS_TAIL * dialRadius;
  const seconds: Layer[] = [
    { geometry: plate([[-0.3, tail], [0.3, tail], [0.14, -0.2 * sL], [0.05, -sL], [-0.05, -sL], [-0.14, -0.2 * sL]], 0.08, 0), material: metal },
    { geometry: hub(0.7, -0.1), material: metal },
  ];
  if (e.hands.secondsDot) seconds.push({ geometry: new THREE.CylinderGeometry(0.9, 0.9, 0.1, 32).rotateX(Math.PI / 2).translate(0, -0.72 * sL, -0.12), material: 'lume' });
  return { hour: one(HOUR * dialRadius, hw), minute: one(MINUTE * dialRadius, mw), seconds };
}
