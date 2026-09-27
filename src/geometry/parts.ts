import * as THREE from 'three';
import type { MaterialKey, Shape } from '../model/schema';
import { addSpokes, extrudeCentered, gearOutline, PINION } from './gear';

export type LayerMaterial = MaterialKey | 'slot' | 'date';
export type Layer = { geometry: THREE.BufferGeometry; material: LayerMaterial };

type Bridge = Extract<Shape, { kind: 'bridge' }>;

const cache = new Map<string, Layer[]>();

export function buildShape(shape: Shape, material: MaterialKey): Layer[] {
  const key = `${material}:${JSON.stringify(shape)}`;
  let layers = cache.get(key);
  if (!layers) {
    layers = build(shape, material);
    cache.set(key, layers);
  }
  return layers;
}

// Cylinder with its axis along Z (three's CylinderGeometry is along Y).
function disc(radius: number, height: number, segments = 48): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radius, radius, height, segments).rotateX(Math.PI / 2);
}

function build(shape: Shape, material: MaterialKey): Layer[] {
  switch (shape.kind) {
    case 'wheel': {
      const s = gearOutline(shape.teeth, shape.module);
      const rf = (shape.module * shape.teeth) / 2 - 1.55 * shape.module;
      if (shape.spokes > 0) addSpokes(s, Math.max(0.6, rf * 0.28), rf * 0.8, shape.spokes, Math.max(0.28, rf * 0.09));
      const body: Layer = { geometry: extrudeCentered(s, shape.thickness, 0.03), material };
      // Spoked train wheels show their arbor pin between plate and bridge; solid wheels sit on pinions and need none.
      return shape.spokes > 0 ? [body, { geometry: disc(0.12, 4.2, 16), material: 'steel' }] : [body];
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
        { geometry: disc(0.6, 0.3, 32).translate(0, 0, 0.2), material: 'blued' },
      ];
    case 'escape-wheel':
      return [{ geometry: escapeWheel(shape.teeth, shape.outerRadius, shape.thickness), material }];
    case 'pallet-fork':
      return palletFork(shape.span, shape.length, shape.thickness, material);
    case 'balance':
      return balanceWheel(shape.radius, shape.rimThickness, shape.arms, material);
    case 'hairspring':
      return [{ geometry: hairspring(shape.turns, shape.innerRadius, shape.pitch), material }];
    case 'plate': {
      const s = new THREE.Shape();
      s.absarc(0, 0, shape.radius, 0, Math.PI * 2, false);
      return [{ geometry: extrudeCentered(s, shape.thickness, 0.12), material }];
    }
    case 'bridge':
      return bridge(shape, material);
    case 'rotor': {
      const s = new THREE.Shape();
      s.absarc(0, 0, shape.radius, 0, Math.PI, false);
      s.absarc(0, 0, shape.hub, Math.PI, 0, true);
      return [{ geometry: extrudeCentered(s, shape.thickness, 0.06), material }, { geometry: disc(shape.hub * 0.75, shape.thickness + 0.15, 48), material: 'steel' }];
    }
    case 'hand':
      return hand(shape.length, shape.width, shape.thickness, material);
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
  }
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

function balanceWheel(radius: number, rim: number, arms: number, material: MaterialKey): Layer[] {
  const layers: Layer[] = [{ geometry: new THREE.TorusGeometry(radius, rim, 24, 160), material }];
  for (let i = 0; i < arms; i++) {
    layers.push({ geometry: new THREE.BoxGeometry(radius * 2, rim * 1.6, rim).rotateZ((i * Math.PI) / arms + 0.3), material });
  }
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.3 + Math.PI / 4;
    layers.push({ geometry: disc(0.2, 0.34, 20).translate((radius + 0.25) * Math.cos(a), (radius + 0.25) * Math.sin(a), 0), material });
  }
  layers.push({ geometry: disc(0.45, 0.4, 32), material }, { geometry: disc(0.1, 3.4, 16), material: 'steel' });
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

function bridge(shape: Bridge, material: MaterialKey): Layer[] {
  const top = shape.thickness / 2;
  const layers: Layer[] = [{ geometry: extrudeCentered(bridgeOutline(shape.lobes), shape.thickness, 0.08), material }];
  for (const j of shape.jewels) {
    layers.push({ geometry: disc(0.36, 0.2).translate(j.x, j.y, top + 0.03), material: 'ruby' });
    layers.push({ geometry: new THREE.TorusGeometry(0.42, 0.06, 12, 48).translate(j.x, j.y, top + 0.03), material: 'steel' });
  }
  for (const sc of shape.screws) {
    layers.push({ geometry: disc(0.42, 0.28).translate(sc.x, sc.y, top + 0.1), material: 'blued' });
    layers.push({ geometry: new THREE.BoxGeometry(0.85, 0.09, 0.12).rotateZ(sc.x).translate(sc.x, sc.y, top + 0.22), material: 'slot' });
  }
  return layers;
}

// Hands point to local −Y (12 o'clock) at angle 0.
function hand(length: number, width: number, thickness: number, material: MaterialKey): Layer[] {
  const s = new THREE.Shape();
  s.moveTo(-width * 0.35, 1.6);
  s.lineTo(width * 0.35, 1.6);
  s.lineTo(width, 0);
  s.lineTo(width * 0.22, -length);
  s.lineTo(0, -length - 0.25);
  s.lineTo(-width * 0.22, -length);
  s.lineTo(-width, 0);
  s.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.3, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return [{ geometry: extrudeCentered(s, thickness, 0.02), material }, { geometry: disc(width + 0.1, 0.2, 32), material }];
}

// Printed ring: UVs map the band's mid radius to 0.87 of the texture radius (see textures.dateNumbers).
function dateRing(teeth: number, rIn: number, rOut: number, thickness: number): Layer[] {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, rIn, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = extrudeCentered(s, thickness, 0.02);
  const scale = ((rIn + rOut) / 2) / 0.87;
  const pos = g.getAttribute('position');
  const uv = g.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / (2 * scale), 0.5 + pos.getY(i) / (2 * scale));
  uv.needsUpdate = true;
  const layers: Layer[] = [{ geometry: g, material: 'date' }];
  for (let i = 0; i < teeth; i++) {
    const a = ((i + 0.5) / teeth) * Math.PI * 2;
    layers.push({ geometry: new THREE.BoxGeometry(0.34, 0.7, thickness).rotateZ(-a).translate(Math.sin(a) * (rIn - 0.25), Math.cos(a) * (rIn - 0.25), 0), material: 'steel' });
  }
  return layers;
}
