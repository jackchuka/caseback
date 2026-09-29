import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { materialKeys } from '../../../../src/scene/exterior/materials';
import { expectRotorClears, radii, rotorOf, zRange } from '../../../../src/test/geometry';
import { caseBack } from './case';
import { belCantoCaseback, soundwaveArcs } from './caseback';
import { P } from './params';

const caliber = calibers['cw-fs01']!;
const m = movementFrame(caliber);
const C = P.caseback;

describe('Bel Canto caseback', () => {
  const layers = belCantoCaseback(m);
  it('is solid titanium: no window, and no engraved text', () => {
    const keys = materialKeys(layers);
    expect(keys).not.toContain('caseback-glass');
    expect(keys).not.toContain('caseback-engraving');
    expect(keys).toContain('caseback-wave');
  });
  it('stamps the soundwave on the plate\'s outer face', () => {
    const plate = layers.find((l) => l.name === 'caseback-solid')!;
    // CylinderGeometry groups: side, the cap facing +Z after the turn (the outer face), the inner cap.
    expect(plate.material).toEqual(['caseback-metal', 'caseback-wave', 'caseback-metal']);
    expect(Math.max(...radii(plate.geometry))).toBeCloseTo(C.plate, 1);
    expect(zRange([plate])[1]).toBeCloseTo(caseBack(m) + C.thickness, 5);
  });
  it('rests on a flange out to its full radius, held by four screws at 1:30, 4:30, 7:30 and 10:30', () => {
    const rim = layers.find((l) => l.name === 'caseback-rim')!;
    expect(Math.max(...radii(rim.geometry))).toBeCloseTo(C.flange, 1);
    const screws = layers.filter((l) => l.name === 'caseback-screw');
    expect(screws).toHaveLength(4);
    const angles = screws.map((s) => {
      s.geometry.computeBoundingBox();
      const c = s.geometry.boundingBox!.getCenter(new THREE.Vector3());
      expect(Math.hypot(c.x, c.y)).toBeCloseTo(C.screwAt, 1);
      expect(c.z).toBeGreaterThan(caseBack(m) + C.flangeThickness - 0.05);
      return Math.round((Math.atan2(c.y, c.x) * 180) / Math.PI);
    });
    expect(angles.sort((a, b) => a - b)).toEqual([...C.screws].sort((a, b) => a - b));
  });
  it('closes over the rotor, closed or lifting off', () => {
    const plate = layers.find((l) => l.name === 'caseback-solid')!;
    expectRotorClears(rotorOf(caliber), { floor: zRange([plate])[0], pocket: C.pocket, span: zRange(layers) });
  });
  it('builds plain, non-interleaved attributes a worker can transfer', () => {
    for (const l of layers) expect(l.geometry.getAttribute('position')).toBeInstanceOf(THREE.BufferAttribute);
  });
});

describe('Bel Canto soundwave', () => {
  const arcs = soundwaveArcs();
  const rings = [...new Set(arcs.map((a) => a.radius))].sort((a, b) => a - b);
  it('spreads concentric rings from a small centre out toward the plate\'s edge', () => {
    expect(rings.length).toBeGreaterThanOrEqual(6);
    expect(rings.at(-1)!).toBeLessThan(C.plate - 1);
    expect(rings[0]!).toBeLessThan(3);
  });
  it('breaks every ring but the centre into four arcs, the gaps on the diagonals', () => {
    for (const r of rings.slice(1)) {
      const ring = arcs.filter((a) => a.radius === r);
      expect(ring, `r=${r}`).toHaveLength(4);
      for (const a of ring) {
        const mid = (a.from + a.to) / 2;
        // Each arc is centred on 3, 6, 9 or 12 o'clock and stops short of the diagonals.
        expect(Math.abs(Math.sin(2 * mid)), `r=${r}`).toBeLessThan(1e-9);
        expect(a.to - a.from).toBeLessThan(Math.PI / 2);
      }
    }
  });
});
