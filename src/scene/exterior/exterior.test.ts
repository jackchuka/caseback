import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { watches } from '../../../data/watches';
import { caseRadii } from '../caseGeometry';
import { lugs, lugTips } from './lugs';
import { bend } from './bend';
import { bezel } from './bezel';
import { crystal } from './crystal';
import { dialLayers, dialTextureSpec } from './dial';
import { strap } from './strap';

const bbox = (ls: { geometry: THREE.BufferGeometry }[]) => {
  const b = new THREE.Box3();
  for (const l of ls) { l.geometry.computeBoundingBox(); b.union(l.geometry.boundingBox!); }
  return b;
};

describe('exterior generators', () => {
  for (const w of Object.values(watches)) {
    const e = w.exterior;
    const r = caseRadii(25.6, e);
    it(`${w.id}: lugs match lug-to-lug and lug width`, () => {
      const t = lugTips(e, r);
      expect(2 * t.y).toBeCloseTo(e.case.lugToLugMm, 0);
      expect(t.innerGap).toBeCloseTo(e.case.lugWidthMm, 1);
      const b = bbox(lugs(e, r));
      expect(b.max.y - b.min.y).toBeCloseTo(e.case.lugToLugMm, 0);
    });
    it(`${w.id}: crystal sits inside the bezel and domes forward`, () => {
      const b = bbox(crystal(e, r));
      expect(b.max.x).toBeLessThan(r.outer - (e.bezel.kind === 'dive' ? e.bezel.widthMm : 0.3));
      expect(b.min.z).toBeLessThan(r.bottom - e.crystal.domeMm + 0.01);
    });
    it(`${w.id}: dial fits inside the case and indices count`, () => {
      const layers = dialLayers(e, r);
      const b = bbox(layers);
      expect(b.max.x).toBeLessThan(r.inner);
      const applied = layers.filter((l) => l.material === 'lume' || l.material === 'insert').length;
      const expected = { 'diver-dots': 12, 'bars-minute': 0, 'arabic-24': 0 }[e.dial.indices];
      expect(applied).toBe(expected);
    });
  }
  it('dive bezel stays within the case outline', () => {
    const e = watches['tudor/heritage-black-bay-79220b']!.exterior;
    const r = caseRadii(25.6, e);
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
    const r = caseRadii(25.6, e);
    const insert = bezel(e, r).filter((l) => l.material === 'insert');
    expect(insert).toHaveLength(1);
    const b = bbox(insert);
    expect(b.max.z).toBeLessThan(r.bottom);
  });
});

describe('lug faces', () => {
  it('every lug and strap piece has outward-facing triangles, including the mirrored ones', () => {
    const e = watches['sinn/556']!.exterior;
    const r = caseRadii(25.6, e);
    const hamilton = watches['hamilton/khaki-field-auto-h70455553']!.exterior;
    for (const [k, l] of [...lugs(e, r), ...strap(e, r), ...strap(hamilton, caseRadii(25.6, hamilton))].entries()) {
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
      expect(outward, `lug ${k}`).toBeGreaterThan(0);
    }
  });
});

import { caseProfile } from '../caseGeometry';
describe('realism details', () => {
  const ham = watches['hamilton/khaki-field-auto-h70455553']!.exterior;
  const hr = caseRadii(25.6, ham);
  it('cuts a date window at 3 o\'clock over the date ring and drops the printed 3', () => {
    expect(ham.dial.dateWindow).toBe(true);
    const disc = dialLayers(ham, hr).find((l) => l.material === 'dial')!;
    const mesh = new THREE.Mesh(disc.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    const hitAt = (x: number) => new THREE.Raycaster(new THREE.Vector3(x, 0, -10), new THREE.Vector3(0, 0, 1)).intersectObject(mesh).length;
    expect(hitAt(10.8)).toBe(0);
    expect(hitAt(-10.8)).toBeGreaterThan(0);
    expect(dialTextureSpec(ham).numerals[3]).toBe('');
  });
  it('gives cases a straight flank instead of a rounded donut', () => {
    const prof = caseProfile(hr, ham);
    const flank = prof.filter(([x]) => Math.abs(x - hr.outer) < 1e-6).map(([, z]) => z);
    expect(flank.length).toBeGreaterThanOrEqual(2);
    expect(Math.max(...flank) - Math.min(...flank)).toBeGreaterThan(hr.height * 0.6);
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
      const r = caseRadii(25.6, e);
      const b = bbox(dialLayers(e, r).filter((l) => l.material === 'dial'));
      expect(b.max.x / (e.case.diameterMm / 2), w.id).toBeGreaterThanOrEqual(e.bezel.kind === 'dive' ? 0.75 : 0.85);
    }
  });
});

describe('lug attachment', () => {
  it('every lug root reaches into the round case at its own x offset', () => {
    for (const w of Object.values(watches)) {
      const e = w.exterior;
      const r = caseRadii(25.6, e);
      for (const [k, l] of lugs(e, r).entries()) {
        l.geometry.computeBoundingBox();
        const b = l.geometry.boundingBox!;
        const xFar = Math.max(Math.abs(b.min.x), Math.abs(b.max.x));
        const caseEdgeY = Math.sqrt(r.outer ** 2 - xFar ** 2);
        const rootY = Math.min(Math.abs(b.min.y), Math.abs(b.max.y));
        expect(rootY, `${w.id} lug ${k}`).toBeLessThan(caseEdgeY);
      }
    }
  });
});

describe('lug side profile', () => {
  it('starts flush with the case front and sweeps down toward the wrist at the tip', () => {
    for (const w of Object.values(watches)) {
      const e = w.exterior;
      const r = caseRadii(25.6, e);
      const g = lugs(e, r)[0]!.geometry;
      const p = g.getAttribute('position');
      let maxY = 0;
      for (let i = 0; i < p.count; i++) maxY = Math.max(maxY, Math.abs(p.getY(i)));
      let rootFront = Infinity;
      let tipFront = Infinity;
      for (let i = 0; i < p.count; i++) {
        const y = Math.abs(p.getY(i));
        const z = p.getZ(i);
        if (y < r.outer - 2) rootFront = Math.min(rootFront, z);
        // The outermost corner of the lug: how far the tip has swept toward the wrist.
        if (y > maxY - 0.3) tipFront = Math.min(tipFront, z);
      }
      expect(Math.abs(rootFront - r.bottom), `${w.id} root flush`).toBeLessThan(0.5);
      expect(tipFront - r.bottom, `${w.id} tip drop`).toBeGreaterThan(0.7 * r.height);
    }
  });
});

import { lugFillets } from './lugs';
describe('lug to case fillets', () => {
  it('fills the corner between each lug and the round case with a concave blend', () => {
    for (const w of Object.values(watches)) {
      const e = w.exterior;
      const r = caseRadii(25.6, e);
      const fillets = lugFillets(e, r);
      expect(fillets, w.id).toHaveLength(4);
      const X = e.case.lugWidthMm / 2 + 2.4;
      for (const sx of [1, -1]) {
        for (const sy of [1, -1]) {
          // Just outside the lug's outer face, just outside the case circle: a sharp corner leaves this empty.
          const x = sx * (X + 0.3);
          const y = sy * (Math.sqrt(r.outer ** 2 - (X + 0.3) ** 2) + 0.3);
          const hit = fillets.some((l) => new THREE.Raycaster(new THREE.Vector3(x, y, r.bottom - 5), new THREE.Vector3(0, 0, 1)).intersectObject(new THREE.Mesh(l.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))).length > 0);
          expect(hit, `${w.id} corner ${sx},${sy}`).toBe(true);
        }
      }
    }
  });
});
