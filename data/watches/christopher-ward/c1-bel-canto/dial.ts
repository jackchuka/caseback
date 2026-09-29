import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import { crease, lathe } from '../../../../src/scene/exterior/kit/lathe';
import fs01 from '../../../calibers/cw-fs01/caliber';
import { P } from './params';

type P2 = [number, number];

// The time display's centre: the sub-dial arbor that carries the hands.
const SUB = fs01.parts.find((p) => p.id === 'hour-hand')!.pos;

// A closed path through `pts`, in the shape's own frame (built facing +Z, so y is flipped: see belCantoDial).
const path = <T extends THREE.Path>(p: T, pts: P2[]) => {
  pts.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, -y) : p.lineTo(x, -y)));
  p.closePath();
  return p;
};

// The keyhole's outline in watch coordinates (12 o'clock −Y): a trapezoid widening downward, its corners rounded.
function keyholeOutline(n = 8): P2[] {
  const k = P.keyhole;
  const corners: P2[] = [[k.x + k.topHalf, k.top], [k.x + k.bottomHalf, k.bottom], [k.x - k.bottomHalf, k.bottom], [k.x - k.topHalf, k.top]];
  return corners.flatMap((c, i) => {
    const prev = corners[(i + 3) % 4]!, next = corners[(i + 1) % 4]!;
    const toward = (q: P2): P2 => {
      const d = Math.hypot(q[0] - c[0], q[1] - c[1]);
      return [c[0] + ((q[0] - c[0]) * k.corner) / d, c[1] + ((q[1] - c[1]) * k.corner) / d];
    };
    const [a, b] = [toward(prev), toward(next)];
    // A quadratic round the corner, from the edge in to the edge out.
    return Array.from({ length: n + 1 }, (_, j): P2 => {
      const t = j / n, u = 1 - t;
      return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
    });
  });
}

// The plate: a disc with the centre hole and the keyhole cut through, extruded back from its face at the dial height.
// Its UVs span the disc so the painted sunray and marks land in register.
function plate(m: MovementFrame) {
  const R = P.dialRadius;
  const s = new THREE.Shape().absarc(0, 0, R, 0, Math.PI * 2, false);
  s.holes.push(new THREE.Path().absarc(0, 0, P.centreHole, 0, Math.PI * 2, true));
  s.holes.push(path(new THREE.Path(), [...keyholeOutline()].reverse()));
  const g = new THREE.ExtrudeGeometry(s, { depth: P.dialThickness, bevelEnabled: false, curveSegments: 90 });
  const pos = g.getAttribute('position');
  const uv = g.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (2 * R) + 0.5, pos.getY(i) / (2 * R) + 0.5);
  // Built facing +Z with its face at z = depth; the turn to the front flips y and puts that face at −depth.
  return g.rotateX(Math.PI).translate(0, 0, m.dialZ + P.dialThickness);
}

// The step round the plate's edge, up to where the case's flange starts: a short wall, then a slope.
function step(m: MovementFrame) {
  const z0 = m.dialZ, z1 = m.dialZ - P.flangeFoot, wall = 0.15;
  return lathe([[P.dialRadius, z0 + 0.05], ...crease([P.dialRadius, z0 - wall]), ...crease([P.bore, z1]), ...crease([P.bore, z0 + 0.05]), [P.dialRadius, z0 + 0.05]], 240);
}

// The floating chapter ring round the sub-dial arbor: bevelled at both edges, flat between.
function chapterRing(m: MovementFrame) {
  const R = P.ring, back = m.dialZ + R.back, front = back - R.thickness;
  const g = lathe([
    ...crease([R.inner, back]), ...crease([R.inner, front + R.bevel * 0.4]), ...crease([R.inner + R.bevel, front]),
    ...crease([R.outer - R.bevel, front]), ...crease([R.outer, front + R.bevel * 0.4]), ...crease([R.outer, back]), [R.inner, back],
  ], 180);
  return g.translate(SUB.x, SUB.y, 0);
}

// A bar from `from` to `to` mm along −Y from the origin, `width` wide and offset `dx` across, standing `height` in
// front of z with a bevelled top.
function bar(from: number, to: number, width: number, height: number, z: number, dx = 0) {
  const bt = height / 3;
  const s = new THREE.Shape().moveTo(dx - width / 2, from).lineTo(dx + width / 2, from).lineTo(dx + width / 2, to).lineTo(dx - width / 2, to).closePath();
  // Built along +Y with its top toward +Z; the turn to the front sends it toward 12 and stands it off z.
  return new THREE.ExtrudeGeometry(s, { depth: height - 2 * bt, bevelEnabled: true, bevelThickness: bt, bevelSize: bt, bevelOffset: -bt, bevelSegments: 2 })
    .translate(0, 0, bt).rotateX(Math.PI).translate(0, 0, z);
}

// Turns a part drawn at 12 (along −Y from the sub-dial arbor) to an hour and sets it round the arbor.
const atSubHour = (g: THREE.BufferGeometry, hour: number) => g.rotateZ((hour / 12) * Math.PI * 2).translate(SUB.x, SUB.y, 0);

function indexes(m: MovementFrame): ExteriorLayer[] {
  const I = P.index, top = m.dialZ + P.ring.back - P.ring.thickness;
  const layers: ExteriorLayer[] = [];
  const add = (hour: number, width: number, dx: number) => {
    layers.push({ geometry: atSubHour(bar(I.from, I.to, width, I.height, top, dx), hour), material: 'index', name: 'index' });
    layers.push({ geometry: atSubHour(bar(I.from + 0.25, I.to - 0.25, Math.min(I.lume, width - 0.3), 0.02, top - I.height + 0.015, dx), hour), material: 'dial-lume', name: 'index-lume' });
  };
  const pairAt = (I.pairWidth + I.pairGap) / 2;
  add(0, I.pairWidth, -pairAt);
  add(0, I.pairWidth, pairAt);
  for (let h = 1; h < 12; h++) add(h, I.width, 0);
  return layers;
}

// The minute track's dashes on the ring, one a minute where no index stands.
function minuteTrack(m: MovementFrame) {
  const z = m.dialZ + P.ring.back - P.ring.thickness - 0.005;
  const dashes: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue;
    const g = new THREE.PlaneGeometry(P.ticks.width, P.ticks.to - P.ticks.from).rotateX(Math.PI).translate(0, -(P.ticks.from + P.ticks.to) / 2, z);
    dashes.push(g.rotateZ((i / 60) * Math.PI * 2).translate(SUB.x, SUB.y, 0));
  }
  return mergeSimple(dashes);
}

// Concatenates non-indexed position/normal/uv geometries into one.
function mergeSimple(gs: THREE.BufferGeometry[]) {
  const flat = gs.map((g) => (g.index ? g.toNonIndexed() : g));
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv'] as const) {
    const size = flat[0]!.getAttribute(name).itemSize;
    out.setAttribute(name, new THREE.Float32BufferAttribute(flat.flatMap((g) => Array.from(g.getAttribute(name).array as Float32Array)), size));
  }
  return out;
}

// The module plate with its keyhole, its stepped edge, and the chapter ring floating at 12 with its indexes and track.
export function belCantoDial(m: MovementFrame): ExteriorLayer[] {
  return [
    { geometry: plate(m), material: 'dial', name: 'plate' },
    { geometry: step(m), material: 'polished', name: 'flange' },
    { geometry: chapterRing(m), material: 'chapter-ring', name: 'chapter-ring' },
    ...indexes(m),
    { geometry: minuteTrack(m), material: 'dial-print', name: 'minute-track', castShadow: false },
  ];
}

// The printed chime marks, as polylines in watch coordinates (photo:front): a wave where the red indicator points
// while the strike is on, and a flat line where it points once silenced.
export function chimeMarks() {
  const { wave, line } = P.marks;
  const [ax, ay] = wave.from, [bx, by] = wave.to;
  const len = Math.hypot(bx - ax, by - ay), [nx, ny] = [-(by - ay) / len, (bx - ax) / len];
  const on = Array.from({ length: 121 }, (_, i): P2 => {
    const t = i / 120, off = wave.amp * Math.sin(t * wave.turns * 2 * Math.PI);
    return [ax + (bx - ax) * t + nx * off, ay + (by - ay) * t + ny * off];
  });
  const [p0, p1, p2] = line;
  // The quadratic through its three points, passing p1 at the middle.
  const c: P2 = [2 * p1[0] - (p0[0] + p2[0]) / 2, 2 * p1[1] - (p0[1] + p2[1]) / 2];
  const off = Array.from({ length: 31 }, (_, i): P2 => {
    const t = i / 30, u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p2[1]];
  });
  return { on, off };
}

// The plate's colour: blue, swept by a sunray of fine radial hairlines, and the chime marks in pale blue. The disc is
// turned to face the front, which already flips it vertically, so the canvas is drawn as seen.
export function paintDial() {
  const size = 2048, R = P.dialRadius, k = size / 2 / R;
  return canvasTexture(size, size, (g) => {
    g.fillStyle = P.dialColor;
    g.fillRect(0, 0, size, size);
    g.save();
    g.translate(size / 2, size / 2);
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    g.lineWidth = 1.2;
    for (let i = 0; i < 1800; i++) {
      const a = (i / 1800) * Math.PI * 2;
      const v = rand();
      g.strokeStyle = v > 0.5 ? `rgba(120,190,235,${0.05 + 0.08 * (v - 0.5)})` : `rgba(4,20,45,${0.06 + 0.1 * v})`;
      g.beginPath();
      g.moveTo(Math.cos(a) * 0.5 * k, Math.sin(a) * 0.5 * k);
      g.lineTo(Math.cos(a) * R * k, Math.sin(a) * R * k);
      g.stroke();
    }
    g.restore();
    g.strokeStyle = P.printColor;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = P.marks.width * k;
    const px = ([x, y]: P2): P2 => [size / 2 + x * k, size / 2 + y * k];
    const { on, off } = chimeMarks();
    for (const line of [on, off]) {
      g.beginPath();
      line.map(px).forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
      g.stroke();
    }
  }, 8);
}

// The sunray's brushing as an anisotropy map (RG: direction in the disc's UV frame, B: strength): brushed along the
// radii, so the sheen stretches round the circle.
export function paintDialGrain() {
  const size = 512;
  const t = canvasTexture(size, size, (g) => {
    const img = g.createImageData(size, size);
    for (let py = 0; py < size; py++)
      for (let px = 0; px < size; px++) {
        const x = px + 0.5 - size / 2, y = py + 0.5 - size / 2;
        const r = Math.hypot(x, y) || 1;
        // Canvas rows run down the texture; UV v runs up.
        const [dx, dy] = [-y / r, x / r];
        const i = (py * size + px) * 4;
        img.data[i] = Math.round((dx * 0.5 + 0.5) * 255);
        img.data[i + 1] = Math.round((-dy * 0.5 + 0.5) * 255);
        img.data[i + 2] = 230;
        img.data[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
  });
  t.colorSpace = THREE.NoColorSpace;
  return t;
}
