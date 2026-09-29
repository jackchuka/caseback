import * as THREE from 'three';
import type { MovementFrame } from '../contract';
import type { P2 } from './sdf';

// Grows a convex polygon outward by d, keeping its edges parallel.
export function offsetConvex(pts: P2[], d: number): P2[] {
  const n = pts.length;
  const cx = pts.reduce((s, p) => s + p[0], 0) / n, cy = pts.reduce((s, p) => s + p[1], 0) / n;
  const normal = (a: P2, b: P2): P2 => {
    const ex = b[0] - a[0], ey = b[1] - a[1], len = Math.hypot(ex, ey);
    const nx = ey / len, ny = -ex / len;
    return (a[0] - cx) * nx + (a[1] - cy) * ny > 0 ? [nx, ny] : [-nx, -ny];
  };
  return pts.map((p, i) => {
    const [ax, ay] = normal(pts[(i + n - 1) % n]!, p), [bx, by] = normal(p, pts[(i + 1) % n]!);
    const k = d / (1 + ax * bx + ay * by);
    return [p[0] + (ax + bx) * k, p[1] + (ay + by) * k];
  });
}

export type DialWindow = { x: number; y: number; width: number; height: number };

// The movement's date window, cut in the dial on the 3 o'clock axis over its date ring.
export function dateWindowOf(m: MovementFrame): DialWindow {
  if (!m.dateWindow) throw new Error('this dial needs a movement with a date ring');
  return { x: m.dateWindow.x, y: 0, width: m.dateWindow.width, height: m.dateWindow.height };
}

// A window's rectangle, built before the turn to the front, which flips y.
function windowRect(w: DialWindow) {
  const x0 = w.x - w.width / 2, x1 = w.x + w.width / 2, y0 = -w.y - w.height / 2, y1 = -w.y + w.height / 2;
  return new THREE.Path().moveTo(x0, y0).lineTo(x0, y1).lineTo(x1, y1).lineTo(x1, y0).closePath();
}

// A flat frame `band` wide round a window, the window cut through it. Like the dial disc it is built facing +Z: turn
// it with rotateX(π) to face the front.
export function windowFrame(w: DialWindow, band: number) {
  const x0 = w.x - w.width / 2 - band, x1 = w.x + w.width / 2 + band, y0 = -w.y - w.height / 2 - band, y1 = -w.y + w.height / 2 + band;
  const s = new THREE.Shape().moveTo(x0, y0).lineTo(x1, y0).lineTo(x1, y1).lineTo(x0, y1).closePath();
  s.holes.push(windowRect(w));
  return s;
}

// The dial disc at depth z, facing the front, its UVs spanning the disc so a painted texture lands in register. A
// window, when given, is cut through it (centre and size in watch coordinates, 12 o'clock toward −Y).
export function dialDisc(radius: number, z: number, window?: DialWindow, segments = 180) {
  let disc: THREE.BufferGeometry;
  if (window) {
    const s = new THREE.Shape().absarc(0, 0, radius, 0, Math.PI * 2, false);
    s.holes.push(windowRect(window));
    disc = new THREE.ShapeGeometry(s, segments / 4);
  } else disc = new THREE.CircleGeometry(radius, segments);
  const pos = disc.getAttribute('position');
  const uv = disc.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (2 * radius) + 0.5, pos.getY(i) / (2 * radius) + 0.5);
  return disc.rotateX(Math.PI).translate(0, 0, z);
}

// Places an index built in its local frame (outer edge's midpoint at the origin, the dial centre toward +Y) at an
// hour, its outer edge on the circle of radius `ring`.
export function atHour(g: THREE.BufferGeometry, hour: number, ring: number, z: number) {
  const a = (hour / 12) * Math.PI * 2;
  return g.rotateZ(a).translate(Math.sin(a) * ring, -Math.cos(a) * ring, z);
}
