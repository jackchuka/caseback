import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { bbox, layersBox, radii } from '../../../../src/test/geometry';
import { belCantoDial, chimeMarks } from './dial';
import { P } from './params';

const caliber = calibers['cw-fs01']!;
const m = movementFrame(caliber);
const part = (id: string) => caliber.parts.find((p) => p.id === id)!;
const hourZ = part('hour-hand').pos.z;
const SUB = part('hour-hand').pos;

describe('Bel Canto module plate', () => {
  const layers = belCantoDial(m);
  const plate = layers.find((l) => l.name === 'plate')!;
  const hits = (x: number, y: number) => {
    const mesh = new THREE.Mesh(plate.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    return new THREE.Raycaster(new THREE.Vector3(x, y, -10), new THREE.Vector3(0, 0, 1)).intersectObject(mesh);
  };
  it('is a blue sunray disc out to the dial radius', () => {
    expect(plate.material).toBe('dial');
    expect(Math.max(...radii(plate.geometry))).toBeCloseTo(P.dialRadius, 2);
    expect(hits(P.dialRadius - 0.1, 0).length).toBeGreaterThan(0);
    expect(hits(-10, 5).length).toBeGreaterThan(0);
  });
  it('opens a centre hole for the arbor and a keyhole below it onto the snail', () => {
    expect(hits(0, 0)).toHaveLength(0);
    expect(hits(0.55, 0)).toHaveLength(0);
    expect(hits(0, 1.5).length).toBeGreaterThan(0);
    for (const [dx, dy] of [[0, 0], [1.1, 0], [-1.1, 0], [0, -1.1], [0, 1.1]]) expect(hits(P.keyhole.x + dx!, P.keyhole.y + dy!), `${dx},${dy}`).toHaveLength(0);
    expect(P.keyhole).toMatchObject({ x: 0, y: 3.6, r: 1.2 });
    // The whole snail window lies inside the opening.
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) expect(hits(P.keyhole.x + 1.19 * Math.cos(a), P.keyhole.y + 1.19 * Math.sin(a))).toHaveLength(0);
    const snail = part('snail');
    if (snail.shape.kind !== 'snail') throw new Error('snail');
    expect(P.keyhole.y - P.keyhole.r).toBeLessThan(snail.shape.rMax);
  });
  it('faces the front at the movement\'s dial height', () => {
    const front = hits(-10, 5)[0]!;
    expect(front.point.z).toBeCloseTo(m.dialZ, 1);
    expect(Math.abs(front.point.z - m.dialZ)).toBeLessThan(0.05);
    expect(bbox(plate.geometry).max.z).toBeLessThanOrEqual(m.dialZ + 0.5);
  });
  it('steps up to the case flange in polished metal outside the gong', () => {
    const flange = layers.find((l) => l.name === 'flange')!;
    expect(flange.material).toBe('polished');
    const r = radii(flange.geometry);
    expect(Math.min(...r)).toBeCloseTo(P.dialRadius, 2);
    expect(Math.max(...r)).toBeCloseTo(P.bore, 2);
    const gong = part('gong');
    if (gong.shape.kind !== 'gong') throw new Error('gong');
    expect(Math.hypot(gong.pos.x, gong.pos.y) + gong.shape.outer + gong.shape.width / 2).toBeLessThan(P.dialRadius);
    // It meets the case's own flange where that one starts.
    expect(bbox(flange.geometry).min.z).toBeCloseTo(m.dialZ - P.flangeFoot, 2);
  });
});

describe('Bel Canto floating chapter ring', () => {
  const layers = belCantoDial(m);
  const ring = layers.find((l) => l.name === 'chapter-ring')!;
  const indexes = layers.filter((l) => l.name === 'index');
  it('is centred on the sub-dial\'s arbor', () => {
    const b = bbox(ring.geometry).getCenter(new THREE.Vector3());
    expect(b.x).toBeCloseTo(SUB.x, 2);
    expect(b.y).toBeCloseTo(SUB.y, 2);
    const r = radii(ring.geometry.clone().translate(-SUB.x, -SUB.y, 0));
    expect(Math.max(...r)).toBeCloseTo(P.ring.outer, 2);
    expect(Math.min(...r)).toBeCloseTo(P.ring.inner, 2);
    expect(ring.material).toBe('chapter-ring');
  });
  it('carries twelve baton indexes, doubled at 12: thirteen bars', () => {
    expect(indexes).toHaveLength(13);
    const at = indexes.map((l) => bbox(l.geometry).getCenter(new THREE.Vector3()).sub(new THREE.Vector3(SUB.x, SUB.y, 0)));
    for (const c of at) expect(Math.hypot(c.x, c.y)).toBeCloseTo((P.index.from + P.index.to) / 2, 1);
    const twelve = at.filter((c) => Math.abs(Math.atan2(c.x, -c.y)) < 0.2);
    expect(twelve).toHaveLength(2);
    for (let h = 1; h < 12; h++) {
      const a = (h / 12) * Math.PI * 2;
      const off = (c: THREE.Vector3) => Math.abs(Math.atan2(Math.sin(Math.atan2(c.x, -c.y) - a), Math.cos(Math.atan2(c.x, -c.y) - a)));
      expect(at.some((c) => off(c) < 0.02), `hour ${h}`).toBe(true);
    }
    for (const l of indexes) expect(l.material).toBe('index');
  });
  it('fills each index with lume and prints a minute track', () => {
    expect(layers.filter((l) => l.material === 'dial-lume')).toHaveLength(13);
    const ticks = layers.find((l) => l.name === 'minute-track')!;
    expect(ticks.material).toBe('dial-print');
    const r = radii(ticks.geometry.clone().translate(-SUB.x, -SUB.y, 0));
    expect(Math.min(...r)).toBeGreaterThan(P.ring.inner);
    expect(Math.max(...r)).toBeLessThan(P.ring.outer);
  });
  it('floats in front of the sub-dial bridge and behind the hour hand', () => {
    const bridge = part('sub-bridge');
    if (bridge.shape.kind !== 'bridge') throw new Error('bridge');
    const raised = layersBox([ring, ...indexes, ...layers.filter((l) => l.material === 'dial-lume' || l.material === 'dial-print')]);
    expect(raised.max.z).toBeLessThan(bridge.pos.z - bridge.shape.thickness / 2 - 0.08);
    expect(raised.min.z).toBeGreaterThan(hourZ);
    expect(raised.min.z).toBeLessThan(m.dialZ);
  });
  it('keeps every vertex within the contract\'s dial band', () => {
    const b = layersBox(layers);
    expect(b.max.z).toBeLessThanOrEqual(m.dialZ + 0.5);
    expect(b.min.z).toBeGreaterThanOrEqual(Math.min(m.dialZ - 0.5, hourZ));
  });
});

describe('Bel Canto chime marks', () => {
  const strike = caliber.couplings.find((c) => c.type === 'strike')!;
  if (strike.type !== 'strike') throw new Error('strike');
  const ind = part('indicator');
  if (ind.shape.kind !== 'lever') throw new Error('indicator');
  // The indicator's tip: its outline point farthest from its pivot, turned by `a`.
  const tipAngle = (a: number) => {
    const tip = ind.shape.kind === 'lever' ? ind.shape.outline.reduce((p, q) => (Math.hypot(q.x, q.y) > Math.hypot(p.x, p.y) ? q : p)) : { x: 1, y: 0 };
    return Math.atan2(tip.y, tip.x) + a;
  };
  const marks = chimeMarks();
  const angleOf = (pts: Array<[number, number]>) => {
    const c = pts.reduce(([sx, sy], [x, y]) => [sx + x / pts.length, sy + y / pts.length], [0, 0]);
    return Math.atan2(c[1] - ind.pos.y, c[0] - ind.pos.x);
  };
  it('prints the wave where the red indicator points while the strike is on', () => {
    // In the photo the arrow points 8° short of each mark's middle: within 9°.
    expect(Math.abs(angleOf(marks.on) - tipAngle(0))).toBeLessThan(0.15);
  });
  it('prints the flat line where it points once silenced', () => {
    expect(Math.abs(angleOf(marks.off) - tipAngle(strike.silence.turn))).toBeLessThan(0.15);
  });
  it('prints both round the arrow\'s tip, on the plate', () => {
    const tipR = Math.max(...ind.shape.kind === 'lever' ? ind.shape.outline.map((p) => Math.hypot(p.x, p.y)) : [0]);
    for (const [x, y] of [...marks.on, ...marks.off]) {
      expect(Math.hypot(x - ind.pos.x, y - ind.pos.y)).toBeGreaterThan(tipR * 0.8);
      expect(Math.hypot(x, y)).toBeLessThan(P.dialRadius);
    }
  });
});
