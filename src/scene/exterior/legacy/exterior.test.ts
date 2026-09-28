import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../../data/calibers';
import { watches } from '../../../../data/watches';
import { movementFrame } from '../frame';
import { caseRadii } from './radii';
import { bend } from '../kit/bend';
import { bezel } from './bezel';
import { crystal } from './crystal';
import { dialLayers, dialTextureSpec } from './dial';
import { strap } from './strap';

const FRAME = movementFrame(calibers['eta-2824-2']!);

const bbox = (ls: { geometry: THREE.BufferGeometry }[]) => {
  const b = new THREE.Box3();
  for (const l of ls) { l.geometry.computeBoundingBox(); b.union(l.geometry.boundingBox!); }
  return b;
};

describe('exterior generators', () => {
  for (const w of Object.values(watches)) {
    const e = w.exterior;
    const r = caseRadii(FRAME, e);
    it(`${w.id}: crystal sits inside the bezel and domes forward`, () => {
      const b = bbox(crystal(e, r));
      expect(b.max.x).toBeLessThan(r.outer - e.bezel.widthMm + 0.2);
      expect(b.min.z).toBeLessThan(r.bottom - e.crystal.domeMm + 0.01);
    });
    it(`${w.id}: dial fits inside the case and indices count`, () => {
      const layers = dialLayers(e, r, FRAME);
      const b = bbox(layers);
      expect(b.max.x).toBeLessThan(r.inner);
      const applied = layers.filter((l) => l.material === 'lume').length;
      const expected = { 'diver-dots': 12, 'bars-minute': 0, 'arabic-24': 0 }[e.dial.indices];
      expect(applied).toBe(expected);
    });
  }
  it('dive bezel stays within the case outline', () => {
    const e = watches['tudor/heritage-black-bay-79220b']!.exterior;
    const r = caseRadii(FRAME, e);
    const b = bbox(bezel(e, r));
    expect(b.max.x).toBeLessThanOrEqual(r.outer + 0.01);
    expect(b.min.x).toBeGreaterThanOrEqual(-(r.outer + 0.01));
  });
  it('prints the right dial furniture', () => {
    expect(dialTextureSpec(watches['hamilton/khaki-field-auto-h70455553']!.exterior)).toEqual({ numerals: ['12', '1', '2', '', '4', '5', '6', '7', '8', '9', '10', '11'], ring24: true, outerMinutes: true, minuteTrack: true });
    expect(dialTextureSpec(watches['sinn/556']!.exterior)).toEqual({ numerals: [], ring24: false, outerMinutes: false, minuteTrack: true });
  });
  it('bends a strip around the X axis toward the wrist', () => {
    const g = bend(new THREE.BoxGeometry(2, 10, 1, 1, 20, 1).translate(0, 5, 0), 8, 0, 1);
    g.computeBoundingBox();
    expect(g.boundingBox!.max.z).toBeGreaterThan(4);
    expect(g.boundingBox!.max.y).toBeLessThan(8.1);
  });
});

describe('dive bezel insert', () => {
  it('sits on the front (dial) side of the case', () => {
    const e = watches['tudor/heritage-black-bay-79220b']!.exterior;
    const r = caseRadii(FRAME, e);
    const insert = bezel(e, r).filter((l) => l.material === 'insert');
    expect(insert).toHaveLength(1);
    const b = bbox(insert);
    expect(b.max.z).toBeLessThan(r.bottom);
  });
});

describe('strap faces', () => {
  it('every strap piece has outward-facing triangles, including the mirrored ones', () => {
    const e = watches['sinn/556']!.exterior;
    const r = caseRadii(FRAME, e);
    const hamilton = watches['hamilton/khaki-field-auto-h70455553']!.exterior;
    for (const [k, l] of [...strap(e, r), ...strap(hamilton, caseRadii(FRAME, hamilton))].entries()) {
      const g = l.geometry.index ? l.geometry.toNonIndexed() : l.geometry;
      const p = g.getAttribute('position');
      g.computeBoundingBox();
      const c = g.boundingBox!.getCenter(new THREE.Vector3());
      let outward = 0;
      const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
      for (let i = 0; i < p.count; i += 3) {
        a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); d.fromBufferAttribute(p, i + 2);
        const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a));
        const m = a.clone().add(b).add(d).divideScalar(3).sub(c);
        outward += Math.sign(n.dot(m));
      }
      expect(outward, `strap ${k}`).toBeGreaterThan(0);
    }
  });
});

describe('realism details', () => {
  const ham = watches['hamilton/khaki-field-auto-h70455553']!.exterior;
  const hr = caseRadii(FRAME, ham);
  it('cuts a date window at 3 o\'clock over the date ring and drops the printed 3', () => {
    expect(ham.dial.dateWindow).toBe(true);
    const disc = dialLayers(ham, hr, FRAME).find((l) => l.material === 'dial')!;
    const mesh = new THREE.Mesh(disc.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    const hitAt = (x: number) => new THREE.Raycaster(new THREE.Vector3(x, 0, -10), new THREE.Vector3(0, 0, 1)).intersectObject(mesh).length;
    expect(hitAt(10.8)).toBe(0);
    expect(hitAt(-10.8)).toBeGreaterThan(0);
    expect(dialTextureSpec(ham).numerals[3]).toBe('');
  });
  it('tapers a leather strap toward its end', () => {
    const pieces = strap(ham, hr);
    const p = pieces[0]!.geometry.getAttribute('position');
    let nearLug = 0;
    let far = 0;
    const tip = ham.case.lugToLugMm / 2;
    for (let i = 0; i < p.count; i++) {
      const y = Math.abs(p.getY(i));
      if (y < tip + 2) nearLug = Math.max(nearLug, Math.abs(p.getX(i)));
      if (Math.hypot(p.getY(i), p.getZ(i)) > tip + 20) far = Math.max(far, Math.abs(p.getX(i)));
    }
    expect(far).toBeLessThan(nearLug - 1);
  });
});

describe('dial proportion', () => {
  it('dials fill most of the case, like the real watches (dial radius ≥ 80 % of the case radius)', () => {
    for (const w of Object.values(watches)) {
      const e = w.exterior;
      const r = caseRadii(FRAME, e);
      const b = bbox(dialLayers(e, r, FRAME).filter((l) => l.material === 'dial'));
      expect(b.max.x / (e.case.diameterMm / 2), w.id).toBeGreaterThanOrEqual(e.bezel.kind === 'dive' ? 0.75 : 0.85);
    }
  });
});

import { crown, fluteCount } from './crown';
describe('crown', () => {
  it('turns a fluted grip at the real diameter and length', () => {
    const e = watches['tudor/heritage-black-bay-79220b']!.exterior;
    const body = crown(e, caseRadii(FRAME, e))[0]!.geometry;
    const p = body.getAttribute('position');
    const radii: number[] = [];
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < p.count; i++) {
      minY = Math.min(minY, p.getY(i)); maxY = Math.max(maxY, p.getY(i));
      if (Math.abs(p.getY(i)) < e.crown.lengthMm / 2 - 0.3) radii.push(Math.hypot(p.getX(i), p.getZ(i)));
    }
    expect(maxY - minY).toBeCloseTo(e.crown.lengthMm, 0);
    expect(Math.max(...radii)).toBeCloseTo(e.crown.diameterMm / 2, 1);
    // Grooves cut into the grip.
    expect(Math.min(...radii.filter((x) => x > e.crown.diameterMm / 4))).toBeLessThan(e.crown.diameterMm / 2 - 0.1);
    expect(fluteCount(e.crown.diameterMm)).toBeGreaterThan(30);
  });
});
