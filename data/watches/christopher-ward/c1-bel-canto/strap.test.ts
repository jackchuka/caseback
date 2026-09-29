import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { P } from './params';
import { belCantoStrap, strapStart } from './strap';

const m = movementFrame(calibers['cw-fs01']!);

describe('Bel Canto leather strap', () => {
  const pieces = belCantoStrap(m);
  it('has two halves, 22 mm straps fitting between the lugs', () => {
    expect(pieces).toHaveLength(2);
    for (const s of pieces) {
      const p = s.geometry.getAttribute('position');
      let w = 0;
      for (let i = 0; i < p.count; i++) if (Math.abs(p.getY(i)) < P.lugToLug / 2) w = Math.max(w, Math.abs(p.getX(i)));
      expect(2 * w).toBeLessThan(P.lugGap);
      expect(2 * w).toBeGreaterThan(P.lugGap - 0.6);
    }
  });
  it('tapers toward its free end', () => {
    const p = pieces[0]!.geometry.getAttribute('position');
    const start = strapStart(m);
    pieces[0]!.geometry.computeBoundingBox();
    const end = pieces[0]!.geometry.boundingBox!.max.z;
    let near = 0, far = 0;
    for (let i = 0; i < p.count; i++) {
      if (Math.abs(p.getY(i) - start.y) < 0.2) near = Math.max(near, Math.abs(p.getX(i)));
      if (p.getZ(i) > end - 0.5) far = Math.max(far, Math.abs(p.getX(i)));
    }
    expect(2 * near).toBeCloseTo(P.strap.width, 1);
    expect(2 * far).toBeCloseTo(P.strap.endWidth, 0);
  });
  it('curves both halves toward the wrist', () => {
    for (const s of pieces) {
      s.geometry.computeBoundingBox();
      expect(s.geometry.boundingBox!.max.z).toBeGreaterThan(P.strap.wristRadius / 2);
    }
  });
  it('faces outward on every piece, the mirrored half included', () => {
    for (const s of pieces) {
      const g = s.geometry.index ? s.geometry.toNonIndexed() : s.geometry;
      const p = g.getAttribute('position');
      g.computeBoundingBox();
      const c = g.boundingBox!.getCenter(new THREE.Vector3());
      let outward = 0;
      const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
      for (let i = 0; i < p.count; i += 3) {
        a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); d.fromBufferAttribute(p, i + 2);
        const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a));
        outward += Math.sign(n.dot(a.clone().add(b).add(d).divideScalar(3).sub(c)));
      }
      expect(outward).toBeGreaterThan(0);
    }
  });
  it('puts the navy leather on top, the lining toward the wrist and the edges in between', () => {
    expect(pieces[0]!.material).toEqual(['strap-edge', 'strap-edge', 'strap-edge', 'strap-edge', 'strap-lining', 'strap']);
    const hsl = new THREE.Color(P.strapColor).getHSL({ h: 0, s: 0, l: 0 });
    expect(hsl.h).toBeGreaterThan(0.55);
    expect(hsl.h).toBeLessThan(0.7);
    expect(hsl.l).toBeLessThan(0.25);
  });
});
