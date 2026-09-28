import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { watches } from '../../../data/watches';
import { caseRadii } from '../caseGeometry';
import { lugs, lugTips } from './lugs';
import { bend } from './bend';
import { bezel } from './bezel';
import { crystal } from './crystal';
import { dialLayers, dialTextureSpec } from './dial';

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
    expect(dialTextureSpec(watches['hamilton/khaki-field-auto-h70455553']!.exterior)).toEqual({ numerals: ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'], ring24: true, minuteTrack: true });
    expect(dialTextureSpec(watches['sinn/556']!.exterior)).toEqual({ numerals: [], ring24: false, minuteTrack: true });
  });
  it('bends a strip around the X axis toward the wrist', () => {
    const g = bend(new THREE.BoxGeometry(2, 10, 1, 1, 20, 1).translate(0, 5, 0), 8, 0, 1);
    g.computeBoundingBox();
    expect(g.boundingBox!.max.z).toBeGreaterThan(4);
    expect(g.boundingBox!.max.y).toBeLessThan(8.1);
  });
});
