import * as THREE from 'three';
import type { MaterialKey, Shape } from '../model/schema';
import { addSpokes, extrudeCentered, gearOutline, PINION } from './gear';

// Movement materials are shared by every caliber; watch materials are built per watch from its exterior data.
// The non-caliber movement materials, exported so exterior/materials.ts derives its key list from the same source.
export const EXTRA_MOVEMENT_MATERIALS = ['slot', 'date', 'day', 'lume'] as const;
export type MovementMaterial = MaterialKey | (typeof EXTRA_MOVEMENT_MATERIALS)[number];
export type WatchMaterial = 'case' | 'polished' | 'crystal' | 'dial' | 'insert' | 'strap' | 'tube';
export type LayerMaterial = MovementMaterial | WatchMaterial;
// A day ring's names are printed centred this far out along its radius (see textures.dayNames), where its window goes.
export const DAY_LABEL_AT = 0.72;
export type Layer = { geometry: THREE.BufferGeometry; material: LayerMaterial };

type Bridge = Extract<Shape, { kind: 'bridge' }>;

const cache = new Map<string, Layer[]>();

// `side` is the movement face the part belongs to. A dial-side bridge is seen from the dial, so its jewels and screws
// go on its −Z face; every other shape builds the same either way.
export function buildShape(shape: Shape, material: MaterialKey, side: 'dial' | 'back' = 'back'): Layer[] {
  const dialBridge = side === 'dial' && shape.kind === 'bridge';
  const key = `${material}:${dialBridge ? 'dial:' : ''}${JSON.stringify(shape)}`;
  let layers = cache.get(key);
  if (!layers) {
    layers = dialBridge ? [buildShape(shape, material)[0]!, ...bridgeFeatures(shape, -1)] : build(shape, material);
    cache.set(key, layers);
  }
  return layers;
}

// Cylinder with its axis along Z (three's CylinderGeometry is along Y).
function disc(radius: number, height: number, segments = 48): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radius, radius, height, segments).rotateX(Math.PI / 2);
}

// An arbor pin or staff from `below` under the part's centre to `above` over it.
function staff(radius: number, span: { below: number; above: number }, segments: number) {
  return disc(radius, span.below + span.above, segments).translate(0, 0, (span.above - span.below) / 2);
}

function build(shape: Shape, material: MaterialKey): Layer[] {
  switch (shape.kind) {
    case 'wheel': {
      const s = gearOutline(shape.teeth, shape.module);
      const rf = (shape.module * shape.teeth) / 2 - 1.55 * shape.module;
      if (shape.spokes > 0) addSpokes(s, Math.max(0.6, rf * 0.28), rf * 0.8, shape.spokes, Math.max(0.28, rf * 0.09));
      const body: Layer = { geometry: extrudeCentered(s, shape.thickness, 0.03), material };
      // Spoked train wheels show their arbor pin between plate and bridge; solid wheels sit on pinions and need none.
      return shape.spokes > 0 ? [body, { geometry: staff(0.12, shape.pin ?? { below: 2.1, above: 2.1 }, 16), material: 'steel' }] : [body];
    }
    case 'pinion':
      return [{ geometry: extrudeCentered(gearOutline(shape.leaves, shape.module, PINION), shape.length, 0.01), material }];
    case 'barrel': {
      const gear = extrudeCentered(gearOutline(shape.teeth, shape.module), shape.thickness, 0.03);
      const r = (shape.module * shape.teeth) / 2 - 2 * shape.module;
      const drum = disc(r, shape.drumHeight, 96).translate(0, 0, shape.drumHeight / 2 + shape.thickness / 2);
      return [{ geometry: gear, material }, { geometry: drum, material }];
    }
    case 'ratchet':
      return [
        { geometry: extrudeCentered(gearOutline(shape.teeth, shape.module), shape.thickness, 0.02), material },
        // A low screw head: the rotor sweeps close over the ratchet.
        { geometry: disc(0.6, 0.16, 32).translate(0, 0, 0.1), material: 'blued' },
      ];
    case 'escape-wheel':
      return [{ geometry: escapeWheel(shape.teeth, shape.outerRadius, shape.thickness), material }];
    case 'pallet-fork':
      return palletFork(shape.span, shape.length, shape.thickness, material);
    case 'balance':
      return balanceWheel(shape.radius, shape.rimThickness, shape.arms, material, shape.pin);
    case 'hairspring':
      return [{ geometry: hairspring(shape.turns, shape.innerRadius, shape.pitch), material }];
    case 'plate': {
      const s = new THREE.Shape();
      s.absarc(0, 0, shape.radius, 0, Math.PI * 2, false);
      for (const slot of shape.slots ?? []) s.holes.push(stadium(slot.from, slot.to, slot.r));
      return [{ geometry: extrudeCentered(s, shape.thickness, 0.12), material }];
    }
    case 'eccentric':
      return [
        { geometry: disc(shape.radius, shape.thickness, 40).translate(shape.throw, 0, 0), material },
        // The arbor's own pivot, so the offset reads against it.
        { geometry: disc(0.18, shape.thickness + 0.1, 16), material: 'ruby' },
      ];
    case 'pawl-lever':
      return [{ geometry: extrudeCentered(pawlLever(shape), shape.thickness, 0.015), material }];
    case 'bridge':
      return bridge(shape, material);
    case 'stem':
      return [{ geometry: disc(shape.radius, shape.length, 24).rotateY(Math.PI / 2), material }];
    case 'rotor': {
      // The hub boss stands proud on the outer (back) face only; underneath it stays flush so the reversers pass close.
      const s = new THREE.Shape();
      s.absarc(0, 0, shape.radius, 0, Math.PI, false);
      s.absarc(0, 0, shape.hub, Math.PI, 0, true);
      return [{ geometry: extrudeCentered(s, shape.thickness, 0.06), material }, { geometry: disc(shape.hub * 0.75, shape.thickness + 0.075, 48).translate(0, 0, 0.0375), material: 'steel' }];
    }
    case 'hand':
      return hand(shape.length, shape.width, shape.thickness, material, shape.style ?? 'leaf');
    case 'date-driver': {
      const s = gearOutline(shape.teeth, shape.module);
      const rf = (shape.module * shape.teeth) / 2 - 1.55 * shape.module;
      addSpokes(s, Math.max(0.6, rf * 0.28), rf * 0.8, 5, Math.max(0.28, rf * 0.09));
      const finger = new THREE.BoxGeometry(0.28, shape.fingerLength, 0.18).translate(0, shape.fingerLength / 2, -0.3);
      const tip = disc(0.2, 0.2, 16).translate(0, shape.fingerLength, -0.3);
      return [{ geometry: extrudeCentered(s, shape.thickness, 0.03), material }, { geometry: finger, material: 'steel' }, { geometry: tip, material: 'steel' }];
    }
    case 'date-ring':
      return dateRing(shape.teeth, shape.innerRadius, shape.outerRadius, shape.thickness);
    case 'day-ring':
      return dateRing(shape.teeth, shape.innerRadius, shape.outerRadius, shape.thickness, 'day');
    case 'heart':
      return [{ geometry: extrudeCentered(heartOutline(shape.radius), shape.thickness, 0.02), material }];
    case 'cam':
      return [
        { geometry: extrudeCentered(camOutline(shape.teeth, shape.radius), shape.thickness, 0.02), material },
        { geometry: disc(0.35, shape.thickness + 0.1, 24), material: 'blued' },
      ];
    case 'snail':
      return [{ geometry: extrudeCentered(snailOutline(shape.rMin, shape.rMax, shape.reverse), shape.thickness, 0.02), material }];
    case 'gong': {
      // The foot at the arcs' end, flush with the band's outer edge so it stays within the gong's round.
      const footR = shape.width * 1.8;
      const at = shape.outer + shape.width / 2 - footR;
      const foot = { x: at * Math.cos(shape.to), y: at * Math.sin(shape.to) };
      return [
        { geometry: extrudeCentered(new THREE.Shape(gongPoints(shape).map(([x, y]) => new THREE.Vector2(x, y))), shape.thickness, 0.02), material },
        { geometry: disc(footR, shape.thickness + 0.1, 24).translate(foot.x, foot.y, 0), material },
      ];
    }
    case 'lever': {
      const s = new THREE.Shape(shape.outline.map((p) => new THREE.Vector2(p.x, p.y)));
      s.holes.push(new THREE.Path().absarc(0, 0, shape.hole, 0, Math.PI * 2, true));
      return [{ geometry: extrudeCentered(s, shape.thickness, 0.02), material }, { geometry: disc(shape.hole, shape.thickness + 0.08, 20), material: 'blued' }];
    }
  }
}

// A slot with round ends from `a` to `b`, wound clockwise so it cuts a hole.
function stadium(a: { x: number; y: number }, b: { x: number; y: number }, r: number): THREE.Path {
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const p = new THREE.Path();
  p.absarc(b.x, b.y, r, ang + Math.PI / 2, ang - Math.PI / 2, true);
  p.absarc(a.x, a.y, r, ang - Math.PI / 2, ang - (3 * Math.PI) / 2, true);
  p.closePath();
  return p;
}

type PawlLever = Extract<Shape, { kind: 'pawl-lever' }>;

// A ring around the eccentric, a long arm along +X, then a fork whose two hooked claws meet the wheel at
// (length, ±reach) from the far and near side.
function pawlLever({ length, reach, hole, width }: PawlLever): THREE.Shape {
  const w = width / 2;
  const hub = hole + width * 0.9;
  const split = length - reach * 2.2;
  const claw = 0.28;
  const s = new THREE.Shape();
  const a = Math.asin(Math.min(0.95, w / hub));
  s.absarc(0, 0, hub, a, 2 * Math.PI - a, false);
  // Lower side: arm to the fork, out along the near arm to its claw, hooking back toward the wheel.
  s.lineTo(split, -w);
  s.lineTo(length - claw, -reach - claw - w);
  s.lineTo(length + claw * 0.6, -reach - claw * 0.2);
  s.lineTo(length, -reach + claw * 0.5);
  s.lineTo(length - claw * 0.9, -reach - claw * 0.3);
  s.lineTo(split + w, -w * 0.6);
  // The gap between the arms, which the wheel sits in.
  s.lineTo(split + w, w * 0.6);
  s.lineTo(length - claw * 0.9, reach + claw * 0.3);
  s.lineTo(length, reach - claw * 0.5);
  s.lineTo(length + claw * 0.6, reach + claw * 0.2);
  s.lineTo(length - claw, reach + claw + w);
  s.lineTo(split, w);
  s.lineTo(hub * Math.cos(a), hub * Math.sin(a));
  const h = new THREE.Path();
  h.absarc(0, 0, hole, 0, Math.PI * 2, true);
  s.holes.push(h);
  return s;
}

function escapeWheel(teeth: number, rOut: number, thickness: number): THREE.BufferGeometry {
  const s = new THREE.Shape();
  const pitch = (Math.PI * 2) / teeth;
  const rf = rOut * 0.72;
  const P = (r: number, a: number): [number, number] => [r * Math.cos(a), r * Math.sin(a)];
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    const club = [P(rf, a), P(rOut * 0.97, a + pitch * 0.18), P(rOut, a + pitch * 0.26), P(rOut * 0.96, a + pitch * 0.36), P(rf * 1.02, a + pitch * 0.62)];
    club.forEach(([x, y], k) => (i === 0 && k === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  }
  s.closePath();
  addSpokes(s, 0.35, rf * 0.82, 4, 0.16);
  return extrudeCentered(s, thickness, 0.015);
}

function palletFork(span: number, length: number, thickness: number, material: MaterialKey): Layer[] {
  const h = span / 2;
  const s = new THREE.Shape();
  s.moveTo(-0.18, 0);
  s.lineTo(-h, 0.95);
  s.lineTo(-h + 0.15, 1.2);
  s.lineTo(0, 0.35);
  s.lineTo(h - 0.15, 1.2);
  s.lineTo(h, 0.95);
  s.lineTo(0.18, 0);
  s.lineTo(0.12, -length + 0.4);
  s.lineTo(0.35, -length + 0.1);
  s.lineTo(0.1, -length);
  s.lineTo(0, -length + 0.2);
  s.lineTo(-0.1, -length);
  s.lineTo(-0.35, -length + 0.1);
  s.lineTo(-0.12, -length + 0.4);
  s.closePath();
  const pallet = (sx: number) =>
    new THREE.BoxGeometry(0.2, 0.55, thickness + 0.02).rotateZ(sx * 0.55).translate(sx * (h - 0.08), 1.28, 0);
  return [
    { geometry: extrudeCentered(s, thickness, 0.012), material },
    { geometry: pallet(-1), material: 'ruby' },
    { geometry: pallet(1), material: 'ruby' },
  ];
}

function balanceWheel(radius: number, rim: number, arms: number, material: MaterialKey, pin = { below: 1.7, above: 1.7 }): Layer[] {
  const layers: Layer[] = [{ geometry: new THREE.TorusGeometry(radius, rim, 24, 160), material }];
  for (let i = 0; i < arms; i++) {
    layers.push({ geometry: new THREE.BoxGeometry(radius * 2, rim * 1.6, rim).rotateZ((i * Math.PI) / arms + 0.3), material });
  }
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.3 + Math.PI / 4;
    layers.push({ geometry: disc(0.2, 0.34, 20).translate((radius + 0.25) * Math.cos(a), (radius + 0.25) * Math.sin(a), 0), material });
  }
  layers.push({ geometry: disc(0.45, 0.4, 32), material }, { geometry: staff(0.1, pin, 16), material: 'steel' });
  layers.push({ geometry: disc(0.07, 0.5, 12).translate(0.9, 0, -0.5), material: 'ruby' });
  return layers;
}

function hairspring(turns: number, inner: number, pitch: number): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  const perTurn = 120;
  for (let i = 0; i <= turns * perTurn; i++) {
    const t = i / perTurn;
    const a = t * Math.PI * 2;
    const r = inner + t * pitch;
    pts.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 0));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.round(turns * perTurn), 0.018, 6);
}

// Smooth outline around a set of circles: ray-cast from the centroid to the farthest circle boundary.
function bridgeOutline(lobes: Bridge['lobes']): THREE.Shape {
  const cx = lobes.reduce((a, l) => a + l.x, 0) / lobes.length;
  const cy = lobes.reduce((a, l) => a + l.y, 0) / lobes.length;
  const pts: THREE.Vector2[] = [];
  for (let k = 0; k < 180; k++) {
    const a = (k / 180) * Math.PI * 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let best = 0;
    for (const l of lobes) {
      const ox = l.x - cx;
      const oy = l.y - cy;
      const b = ox * dx + oy * dy;
      const disc2 = b * b - (ox * ox + oy * oy - l.r * l.r);
      if (disc2 >= 0) best = Math.max(best, b + Math.sqrt(disc2));
    }
    pts.push(new THREE.Vector2(cx + dx * best, cy + dy * best));
  }
  const s = new THREE.Shape();
  s.setFromPoints(new THREE.SplineCurve([...pts, pts[0]!]).getPoints(240));
  return s;
}

// The outline of the lobes' smooth union: marching squares over the blended distance field. The union must trace one
// closed loop; anything else (disjoint lobes, a contour cut by the grid) is a data error and throws.
export function blendedOutline(lobes: Bridge['lobes'], k: number, step = 0.05): THREE.Shape {
  const smin = (a: number, b: number) => {
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - (h * h * k) / 4;
  };
  const f = (x: number, y: number) => lobes.reduce((d, l) => smin(d, Math.hypot(x - l.x, y - l.y) - l.r), Infinity);
  // The smooth-min pushes the surface out by up to k/4 beyond the lobes' own discs.
  const pad = k / 4 + 2 * step;
  const x0 = Math.min(...lobes.map((l) => l.x - l.r)) - pad, y0 = Math.min(...lobes.map((l) => l.y - l.r)) - pad;
  const nx = Math.ceil((Math.max(...lobes.map((l) => l.x + l.r)) + pad - x0) / step);
  const ny = Math.ceil((Math.max(...lobes.map((l) => l.y + l.r)) + pad - y0) / step);
  const v = new Float64Array((nx + 1) * (ny + 1));
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) v[j * (nx + 1) + i] = f(x0 + i * step, y0 + j * step);
  const at = (i: number, j: number) => v[j * (nx + 1) + i]!;
  // Edge points keyed by the grid edge they sit on, so segments sharing an edge join up.
  const point = new Map<string, [number, number]>();
  const edge = (i: number, j: number, horizontal: boolean) => {
    const key = `${horizontal ? 'h' : 'v'}${i},${j}`;
    if (!point.has(key)) {
      const a = at(i, j), b = horizontal ? at(i + 1, j) : at(i, j + 1);
      const t = a / (a - b);
      point.set(key, horizontal ? [x0 + (i + t) * step, y0 + j * step] : [x0 + i * step, y0 + (j + t) * step]);
    }
    return key;
  };
  const links = new Map<string, string[]>();
  const link = (p: string, q: string) => {
    links.set(p, [...(links.get(p) ?? []), q]);
    links.set(q, [...(links.get(q) ?? []), p]);
  };
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      // Corners 0..3 counter-clockwise from (i, j); edge e runs from corner e to corner e + 1.
      const inside = [at(i, j) < 0, at(i + 1, j) < 0, at(i + 1, j + 1) < 0, at(i, j + 1) < 0];
      const crossing = [0, 1, 2, 3].filter((e) => inside[e] !== inside[(e + 1) % 4]);
      if (crossing.length === 0) continue;
      const edges = [edge(i, j, true), edge(i + 1, j, false), edge(i, j + 1, true), edge(i, j, false)];
      if (crossing.length === 2) {
        link(edges[crossing[0]!]!, edges[crossing[1]!]!);
        continue;
      }
      // A saddle: cut off the two corners that differ from the cell's centre, each by its own two edges.
      const centre = f(x0 + (i + 0.5) * step, y0 + (j + 0.5) * step) < 0;
      for (let c = 0; c < 4; c++) if (inside[c] !== centre) link(edges[(c + 3) % 4]!, edges[c]!);
    }
  const loops: string[][] = [];
  const seen = new Set<string>();
  for (const start of links.keys()) {
    if (seen.has(start)) continue;
    const loop = [start];
    seen.add(start);
    for (let cur = start; ; ) {
      const nxt = links.get(cur)!.find((q) => !seen.has(q));
      if (!nxt) break;
      seen.add(nxt);
      loop.push(nxt);
      cur = nxt;
    }
    if (loop.length < 3 || !links.get(loop.at(-1)!)!.includes(start)) throw new Error('blendedOutline: the traced outline is not closed');
    loops.push(loop);
  }
  if (loops.length !== 1) throw new Error(`blendedOutline: the lobes trace ${loops.length} outlines, not one`);
  return new THREE.Shape(loops[0]!.map((key) => new THREE.Vector2(...point.get(key)!)));
}

function bridge(shape: Bridge, material: MaterialKey): Layer[] {
  const outline = shape.blend === undefined ? bridgeOutline(shape.lobes) : blendedOutline(shape.lobes, shape.blend);
  return [{ geometry: extrudeCentered(outline, shape.thickness, 0.08), material }, ...bridgeFeatures(shape, 1)];
}

// A bridge's jewels (with their chatons) and screws (with their slots) on the face toward `face` × Z. Each feature is
// symmetric in z, so the dial face's are the back face's moved across.
function bridgeFeatures(shape: Bridge, face: 1 | -1): Layer[] {
  const top = shape.thickness / 2;
  const layers: Layer[] = [];
  for (const j of shape.jewels) {
    layers.push({ geometry: disc(0.36, 0.2).translate(j.x, j.y, face * (top + 0.03)), material: 'ruby' });
    layers.push({ geometry: new THREE.TorusGeometry(0.42, 0.06, 12, 48).translate(j.x, j.y, face * (top + 0.03)), material: 'steel' });
  }
  for (const sc of shape.screws) {
    // Screw heads stand just proud of the bridge; the automatic works sweep close over them.
    layers.push({ geometry: disc(0.42, 0.28).translate(sc.x, sc.y, face * (top + 0.05)), material: 'blued' });
    layers.push({ geometry: new THREE.BoxGeometry(0.85, 0.09, 0.12).rotateZ(sc.x).translate(sc.x, sc.y, face * (top + 0.17)), material: 'slot' });
  }
  return layers;
}

// Hands point to local −Y (12 o'clock) at angle 0.
type HandStyle = 'leaf' | 'sword' | 'pencil' | 'baton';

// Hands point to local −Y (12 o'clock) at angle 0; every style ends its tip at length + 0.25.
function handOutline(style: HandStyle, length: number, w: number): THREE.Shape {
  const s = new THREE.Shape();
  const tip = -length - 0.25;
  const pts: Array<[number, number]> =
    style === 'sword'
      ? [[-w * 0.2, 1.4], [w * 0.2, 1.4], [w, -0.15 * length], [0, tip], [-w, -0.15 * length]]
      : style === 'pencil'
        ? [[-w * 0.35, 1.4], [w * 0.35, 1.4], [w * 0.35, -0.8 * length], [w * 1.4, -0.9 * length], [0, tip], [-w * 1.4, -0.9 * length], [-w * 0.35, -0.8 * length]]
        : style === 'baton'
          ? [[-w * 0.6, 1.2], [w * 0.6, 1.2], [w * 0.6, tip], [-w * 0.6, tip]]
          : [[-w * 0.35, 1.6], [w * 0.35, 1.6], [w, 0], [w * 0.22, -length], [0, tip], [-w * 0.22, -length], [-w, 0]];
  pts.forEach(([x, y], k) => (k === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, Math.min(0.3, w * 0.5), 0, Math.PI * 2, true);
  s.holes.push(hole);
  return s;
}

function hand(length: number, width: number, thickness: number, material: MaterialKey, style: HandStyle): Layer[] {
  return [{ geometry: extrudeCentered(handOutline(style, length, width), thickness, 0.02), material }, { geometry: disc(width + 0.1, 0.2, 32), material }];
}

// A heart cam's rim, with its low point (the cleft, 0.55 of its radius) along +X and its high point along −X. The rim
// rises as a spiral from the cleft to the high point on each side, so a hammer pressing it always turns it until the
// cleft faces the hammer: its zero.
export function heartPoints(radius: number, n = 48): Array<[number, number]> {
  const r = (a: number) => radius * (0.55 + (0.45 * Math.abs(a)) / Math.PI);
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI + (2 * Math.PI * i) / n;
    return [r(a) * Math.cos(a), r(a) * Math.sin(a) * 0.9];
  });
}

function heartOutline(radius: number): THREE.Shape {
  const s = new THREE.Shape(heartPoints(radius).map(([x, y]) => new THREE.Vector2(x, y)));
  s.holes.push(new THREE.Path().absarc(0, 0, 0.18, 0, Math.PI * 2, true));
  return s;
}

// A stepped switching cam: `teeth` ratchet teeth, each with a raised lobe on every second one so a lever alternately
// rises and drops with each step.
function camOutline(teeth: number, radius: number): THREE.Shape {
  const s = new THREE.Shape();
  const pitch = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    const top = radius * (i % 2 === 0 ? 1 : 0.86);
    const pts: Array<[number, number]> = [[radius * 0.72, a], [top, a + pitch * 0.75], [top * 0.97, a + pitch * 0.95]];
    pts.forEach(([r, t], k) => (i === 0 && k === 0 ? s.moveTo(r * Math.cos(t), r * Math.sin(t)) : s.lineTo(r * Math.cos(t), r * Math.sin(t))));
  }
  s.closePath();
  s.holes.push(new THREE.Path().absarc(0, 0, 0.2, 0, Math.PI * 2, true));
  return s;
}

// Printed ring. A date ring's UVs map the band's mid radius to 0.87 of the texture radius (see textures.dateNumbers);
// a day ring's map its outer edge to the texture's edge, its names at DAY_LABEL_AT.
function dateRing(teeth: number, rIn: number, rOut: number, thickness: number, print: 'date' | 'day' = 'date'): Layer[] {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, rIn, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = extrudeCentered(s, thickness, 0.02);
  const scale = print === 'day' ? rOut : ((rIn + rOut) / 2) / 0.87;
  const pos = g.getAttribute('position');
  const uv = g.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / (2 * scale), 0.5 + pos.getY(i) / (2 * scale));
  uv.needsUpdate = true;
  const layers: Layer[] = [{ geometry: g, material: print }];
  for (let i = 0; i < teeth; i++) {
    const a = ((i + 0.5) / teeth) * Math.PI * 2;
    layers.push({ geometry: new THREE.BoxGeometry(0.34, 0.7, thickness).rotateZ(-a).translate(Math.sin(a) * (rIn - 0.25), Math.cos(a) * (rIn - 0.25), 0), material: 'steel' });
  }
  return layers;
}

type Gong = Extract<Shape, { kind: 'gong' }>;

// A snail's rim from its low point at +X round a full turn to its high point, back at +X: the step. It climbs toward
// +Y, or toward −Y when `reverse`.
export function snailPoints(rMin: number, rMax: number, n = 96, reverse = false): Array<[number, number]> {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    const r = rMin + ((rMax - rMin) * i) / n;
    return [r * Math.cos(a), (reverse ? -1 : 1) * r * Math.sin(a)];
  });
}

function snailOutline(rMin: number, rMax: number, reverse?: boolean): THREE.Shape {
  const s = new THREE.Shape(snailPoints(rMin, rMax, 96, reverse).map(([x, y]) => new THREE.Vector2(x, y)));
  s.holes.push(new THREE.Path().absarc(0, 0, 0.2, 0, Math.PI * 2, true));
  return s;
}

// The gong band's outline, once round: out along the outer arc's outside edge to the hairpin, round it, along the
// inner arc's inside edge to its free end, and back along the other two edges. The hairpin bulges back past `from`.
export function gongPoints({ outer, inner, from, to, width }: Gong): Array<[number, number]> {
  const w = width / 2;
  const n = Math.max(8, Math.ceil(Math.abs(to - from) / (Math.PI / 90)));
  const arc = (r: number, a0: number, a1: number): Array<[number, number]> =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = a0 + ((a1 - a0) * i) / n;
      return [r * Math.cos(a), r * Math.sin(a)];
    });
  const mid = (outer + inner) / 2;
  const u = { x: Math.cos(from), y: Math.sin(from) };
  const back = { x: Math.sin(from), y: -Math.cos(from) };
  const bend = (r: number, t0: number, t1: number): Array<[number, number]> =>
    Array.from({ length: 17 }, (_, i) => {
      const t = t0 + ((t1 - t0) * i) / 16;
      return [mid * u.x + r * (u.x * Math.cos(t) + back.x * Math.sin(t)), mid * u.y + r * (u.y * Math.cos(t) + back.y * Math.sin(t))];
    });
  const half = (outer - inner) / 2;
  return [
    ...arc(outer + w, to, from),
    ...bend(half + w, 0, Math.PI).slice(1, -1),
    ...arc(inner - w, from, to),
    ...arc(inner + w, to, from),
    ...bend(half - w, Math.PI, 0).slice(1, -1),
    ...arc(outer - w, from, to),
  ];
}
