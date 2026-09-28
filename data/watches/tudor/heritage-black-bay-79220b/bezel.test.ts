import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { bezelMarks, bezelTop, tudorBezel } from './bezel';
import { caseFront } from './case';
import { T } from './params';

const m = movementFrame(calibers['eta-2824-2']!);
const box = (ls: { geometry: THREE.BufferGeometry }[]) => {
  const b = new THREE.Box3();
  for (const l of ls) { l.geometry.computeBoundingBox(); b.union(l.geometry.boundingBox!); }
  return b;
};

describe('Tudor 79220B bezel', () => {
  it('scales the first quarter hour by minutes, the rest by fives and tens', () => {
    const marks = bezelMarks();
    const count = (k: string) => marks.filter((x) => x.kind === k).length;
    expect(count('triangle')).toBe(1);
    // Minutes 1–14 minus the two already claimed by the 5 (bar) and 10 (numeral) marks: 12.
    expect(count('tick')).toBe(12);
    expect(count('bar')).toBe(6);
    expect(marks.filter((x) => x.kind === 'numeral').map((x) => x.text)).toEqual(['10', '20', '30', '40', '50']);
    expect(marks.filter((x) => x.flipped).map((x) => x.text)).toEqual(['20', '30', '40']);
  });
  const layers = tudorBezel(m);
  it('is as wide as the case and sits on its front', () => {
    const b = box(layers.filter((l) => l.material === 'polished' && l.name !== 'flange'));
    expect(b.max.x).toBeCloseTo(T.bezelOuter, 1);
    expect(b.max.z).toBeLessThanOrEqual(caseFront(m) + 0.01);
    expect(bezelTop(m)).toBeCloseTo(caseFront(m) - T.bezelHeight, 5);
  });
  it('cuts a coin edge', () => {
    const body = layers[0]!.geometry.getAttribute('position');
    let min = Infinity;
    for (let i = 0; i < body.count; i++) {
      const r = Math.hypot(body.getX(i), body.getY(i));
      if (r > T.bezelOuter - 0.5) min = Math.min(min, r);
    }
    expect(min).toBeLessThan(T.bezelOuter - T.knurlDepth * 0.8);
  });
  it('puts a lume pip at 12 o\'clock in front of the insert', () => {
    const pip = box(layers.filter((l) => l.material === 'lume'));
    const insert = box(layers.filter((l) => l.material === 'insert'));
    expect(pip.getCenter(new THREE.Vector3()).y).toBeLessThan(-T.insertInner);
    expect(Math.abs(pip.getCenter(new THREE.Vector3()).x)).toBeLessThan(0.01);
    // The insert is a cone, so compare against its height at the pip's radius.
    expect(pip.min.z).toBeLessThan(insert.min.z + (T.pipAt - T.insertInner) * (T.insertDrop / (T.insertOuter - T.insertInner)));
  });
  it('closes the gap between the dial edge and the case front with a flange facing the centre', () => {
    const g = layers.find((l) => l.name === 'flange')!.geometry;
    const b = box([{ geometry: g }]);
    expect(b.max.z).toBeCloseTo(m.dialZ, 1);
    expect(b.min.z).toBeCloseTo(caseFront(m), 1);
    g.computeVertexNormals();
    const p = g.getAttribute('position'), n = g.getAttribute('normal');
    for (let i = 0; i < p.count; i += 17) expect(p.getX(i) * n.getX(i) + p.getY(i) * n.getY(i)).toBeLessThan(0);
  });
  it('slopes the insert down from the crystal to the coin edge by the measured drop', () => {
    const g = layers.find((l) => l.material === 'insert')!.geometry;
    const p = g.getAttribute('position');
    let zi = 0, zo = 0;
    for (let i = 0; i < p.count; i++) {
      const r = Math.hypot(p.getX(i), p.getY(i));
      if (Math.abs(r - T.insertInner) < 1e-3) zi = p.getZ(i);
      if (Math.abs(r - T.insertOuter) < 1e-3) zo = p.getZ(i);
    }
    expect(zo - zi).toBeCloseTo(T.insertDrop, 3);
    const pip = box(layers.filter((l) => l.material === 'lume'));
    const zAtPip = zi + (T.pipAt - T.insertInner) * (T.insertDrop / (T.insertOuter - T.insertInner));
    expect(pip.max.z).toBeLessThan(zAtPip);
    expect(pip.max.z).toBeGreaterThan(zAtPip - 0.6);
  });
});
