export type Insets = { left: number; top: number; right: number; bottom: number };
export type Box = { left: number; top: number; right: number; bottom: number };
// The camera's view offset: the subject drawn at `scale`, its centre moved by (dx, dy) screen pixels.
export type Frame = { dx: number; dy: number; scale: number };

export const NO_INSETS: Insets = { left: 0, top: 0, right: 0, bottom: 0 };
export const IDENTITY: Frame = { dx: 0, dy: 0, scale: 1 };
const MIN_SCALE = 0.25;

// Which edge a box hides: the one whose strip, cut up to the box, leaves the largest free rectangle.
export function insetsOf(boxes: Box[], w: number, h: number): Insets {
  const out = { ...NO_INSETS };
  for (const b of boxes) {
    if (b.right <= b.left || b.bottom <= b.top || b.right <= 0 || b.bottom <= 0 || b.left >= w || b.top >= h) continue;
    const cuts: Array<[keyof Insets, number, number]> = [
      ['left', b.right, (w - b.right) * h],
      ['right', w - b.left, b.left * h],
      ['top', b.bottom, (h - b.bottom) * w],
      ['bottom', h - b.top, b.top * w],
    ];
    const [side, depth] = cuts.reduce((best, c) => (c[2] > best[2] ? c : best));
    out[side] = Math.max(out[side], depth);
  }
  return out;
}

// Centres the subject in the area the insets leave free. With `extent` (how far the subject reaches from its centre
// on screen at scale 1) the subject is also shrunk until it fits inside that area.
export function frameFor(w: number, h: number, insets: Insets, extent: { x: number; y: number } | null, margin = 16): Frame {
  const left = Math.min(insets.left, w * 0.7), right = Math.min(insets.right, w * 0.7);
  const top = Math.min(insets.top, h * 0.7), bottom = Math.min(insets.bottom, h * 0.7);
  const freeW = Math.max(1, w - left - right), freeH = Math.max(1, h - top - bottom);
  const dx = left + freeW / 2 - w / 2, dy = top + freeH / 2 - h / 2;
  if (!extent || extent.x <= 0 || extent.y <= 0) return { dx, dy, scale: 1 };
  const fit = Math.min((freeW / 2 - margin) / extent.x, (freeH / 2 - margin) / extent.y);
  return { dx, dy, scale: Math.min(1, Math.max(MIN_SCALE, fit)) };
}

// Arguments to camera.setViewOffset: a full view `scale` times the canvas, of which the canvas shows a window
// moved so the full view's centre lands at the frame's offset.
export function viewOffset(w: number, h: number, f: Frame): [number, number, number, number, number, number] {
  const fw = w * f.scale, fh = h * f.scale;
  return [fw, fh, fw / 2 - (w / 2 + f.dx), fh / 2 - (h / 2 + f.dy), w, h];
}
