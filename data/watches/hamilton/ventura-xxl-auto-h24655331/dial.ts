import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import type { P2 } from '../../../../src/scene/exterior/kit/sdf';
import { V } from './params';
import { outlines } from './plan';

// Half the side of the square the dial's texture spans, centred on the pivot.
export const DIAL_SPAN = 20;

// Distance from the pivot to an outline along a direction (clock angle, 0 at 12, clockwise).
export function reach(outline: P2[], angle: number) {
  const dx = Math.sin(angle), dy = -Math.cos(angle);
  let best = Infinity;
  for (let i = 0; i < outline.length; i++) {
    const [ax, ay] = outline[i]!, [bx, by] = outline[(i + 1) % outline.length]!;
    const ex = bx - ax, ey = by - ay;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = (ax * ey - ay * ex) / den, u = (ax * dy - ay * dx) / den;
    if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t);
  }
  return best;
}

// Clock angles of the triangle's corners, where the dial's outline has its vertices and the lances sit.
export const cornerAngles = () => {
  const angle = ([x, y]: P2) => Math.atan2(x, -y);
  const far = (pts: P2[]) => pts.reduce((a, b) => (Math.hypot(...b) > Math.hypot(...a) ? b : a));
  const upper = far(outlines.dial.filter(([x, y]) => x > 0 && y < 0));
  return [(3 * Math.PI) / 2, angle(upper), Math.PI - angle(upper)];
};

// Keeps the part of a convex polygon on the side of the line through `p` that `n` points away from.
function clip(poly: P2[], p: P2, n: P2): P2[] {
  const side = (q: P2) => (q[0] - p[0]) * n[0] + (q[1] - p[1]) * n[1];
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!, b = poly[(i + 1) % poly.length]!;
    const sa = side(a), sb = side(b);
    if (sa <= 0) out.push(a);
    if (sa < 0 !== sb < 0) {
      const t = sa / (sa - sb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

// The three grille panels: the inner triangle split by black arms from the pivot to its corners, less the hub. The
// arms taper from the hub out to the corners.
export function dialPanels(): P2[][] {
  const { corners, arm, hub } = V.dialPanels;
  return corners.map((a, i) => {
    const b = corners[(i + 1) % corners.length]!;
    let poly: P2[] = [[0, 0], a, b];
    for (const c of [a, b]) {
      const len = Math.hypot(...c);
      const u: P2 = [c[0] / len, c[1] / len];
      // The arm's edge on the panel's side: offset toward the other corner.
      const other = c === a ? b : a;
      const s = Math.sign(u[0] * other[1] - u[1] * other[0]);
      const n: P2 = [s * u[1], -s * u[0]];
      // The arm's edge runs from `arm.hub` off its centre line at the pivot to `arm.corner` off it at the corner.
      const p0: P2 = [-n[0] * arm.hub, -n[1] * arm.hub];
      const p1: P2 = [c[0] - n[0] * arm.corner, c[1] - n[1] * arm.corner];
      const ex = p1[0] - p0[0], ey = p1[1] - p0[1], el = Math.hypot(ex, ey);
      let e: P2 = [ey / el, -ex / el];
      if (e[0] * n[0] + e[1] * n[1] < 0) e = [-e[0], -e[1]];
      poly = clip(poly, p0, e);
    }
    const mid: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const ml = Math.hypot(...mid);
    poly = clip(poly, [(mid[0] / ml) * hub, (mid[1] / ml) * hub], [-mid[0] / ml, -mid[1] / ml]);
    return poly;
  });
}

const flat = (outline: P2[], holes: P2[][], z: number) => {
  // Built with y negated so the turn to face the front (rotateX(π)) puts it back.
  const flip = (pts: P2[]) => pts.map(([x, y]) => new THREE.Vector2(x, -y));
  const s = new THREE.Shape(flip(outline));
  for (const h of holes) s.holes.push(new THREE.Path(flip(h)));
  const g = new THREE.ShapeGeometry(s).rotateX(Math.PI).translate(0, 0, z);
  const pos = g.getAttribute('position'), uv = g.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + DIAL_SPAN) / (2 * DIAL_SPAN), (DIAL_SPAN - pos.getY(i)) / (2 * DIAL_SPAN));
  return g;
};

// An applied lance, faceted to a ridge, its outer end at `outer` from the pivot along the clock angle.
function lance(angle: number, outer: number, z: number) {
  const { length: L, width } = V.lance;
  const w = width / 2;
  // Local frame: along −Y from the inner end (y = 0) to the outer point (y = −L).
  const s = new THREE.Shape([[0, 0.3], [w, -0.6], [w * 0.8, -(L - 1.4)], [0, -L], [-w * 0.8, -(L - 1.4)], [-w, -0.6]].map(([x, y]) => new THREE.Vector2(x!, y!)));
  const h = 0.45;
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelThickness: h, bevelSize: w * 0.9, bevelOffset: -w * 0.9, bevelSegments: 1 });
  // Centred on the dial's face: the back half sinks into the dial.
  g.translate(0, 0, -0.01);
  const inner = outer - L;
  return g.rotateZ(angle).translate(Math.sin(angle) * inner, -Math.cos(angle) * inner, z);
}

// The black "sound box" dial: its outline follows the case opening, three grille panels between the arms show the
// movement, and three faceted lances mark the triangle's corners. Ticks and the red hatch are printed (paintDial).
export function venturaDial(m: MovementFrame): ExteriorLayer[] {
  const panels = dialPanels();
  const shade = V.dateShade;
  const layers: ExteriorLayer[] = [
    { geometry: flat(outlines.dial, panels, m.dialZ), material: 'dial', name: 'dial' },
    // The grille sits a little behind the dial's face, cut by its texture's alpha so the movement shows through. It is
    // part of the dial, and named so for hit tests.
    ...panels.map((p): ExteriorLayer => ({ geometry: flat(p, [], m.dialZ + 0.08), material: 'dial-grille', name: 'dial' })),
    // The H-10 in this watch has no date, but the shared 2824-2 model carries a date ring: a dark band behind the grille
    // hides it, and fades with the dial so the movement itself stays whole.
    { geometry: new THREE.RingGeometry(shade.inner, shade.outer, 180).rotateX(Math.PI).translate(0, 0, m.dialZ + shade.depth), material: 'dial-shade', name: 'dial', castShadow: false },
  ];
  const angles = cornerAngles();
  const outer = [V.lanceOuter.nine, V.lanceOuter.corner, V.lanceOuter.corner];
  angles.forEach((a, i) => layers.push({ geometry: lance(a, outer[i]!, m.dialZ - 0.005), material: 'polished', name: 'lance' }));
  return layers;
}

// Which minutes carry the red hatch: from just past 12 round to 3, clear of the 1 o'clock lance.
export const isRed = (minute: number) => minute >= V.red.from && minute <= V.red.to && !(minute > V.red.gap[0] && minute < V.red.gap[1]);
// Minutes whose tick gives way to a lance.
export const lanceMinutes = () => cornerAngles().map((a) => Math.round((a / (2 * Math.PI)) * 60) % 60);

export function paintDial() {
  const size = 2048;
  const k = size / (2 * DIAL_SPAN);
  return canvasTexture(size, size, (g) => {
    g.fillStyle = '#0c0c0d';
    g.fillRect(0, 0, size, size);
    g.translate(size / 2, size / 2);
    const { inset, length } = V.track;
    const radial = (minute: number, width: number, color: string) => {
      const a = (minute / 60) * Math.PI * 2;
      const r = reach(outlines.dial, a) - inset;
      g.save();
      g.rotate(a);
      g.fillStyle = color;
      g.fillRect((-width / 2) * k, -r * k, width * k, length * k);
      g.restore();
    };
    for (let q = 0; q < 60 * 5; q++) if (isRed(q / 5)) radial(q / 5, 0.07, '#b3121b');
    const skip = new Set(lanceMinutes());
    for (let i = 0; i < 60; i++) if (!skip.has(i)) radial(i, i % 5 === 0 ? V.track.fiveWidth : V.track.width, '#e9ebee');
  }, 8);
}

// The grille's mask: diamond holes on a square pitch turned 45°, white where the mesh is solid.
export function paintGrille() {
  const size = 1024;
  const cells = Math.round((2 * DIAL_SPAN) / V.dialPanels.mesh);
  const c = size / cells;
  return canvasTexture(size, size, (g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, size, size);
    g.fillStyle = '#fff';
    const bar = c * 0.3;
    g.save();
    // Diagonal bars both ways leave diamond holes.
    for (let i = -cells; i < 2 * cells; i++) {
      g.save(); g.translate(i * c, 0); g.transform(1, 0, 1, 1, 0, 0); g.fillRect(-bar / 2, 0, bar, size); g.restore();
      g.save(); g.translate(i * c, 0); g.transform(1, 0, -1, 1, 0, 0); g.fillRect(-bar / 2, 0, bar, size); g.restore();
    }
    g.restore();
  });
}
