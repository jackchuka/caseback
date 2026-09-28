import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { dateWindow, dialPrint, hamiltonDial } from './dial';
import { H } from './params';

const caliber = calibers['eta-2824-2']!;
const m = movementFrame(caliber);
const bbox = (g: THREE.BufferGeometry) => { g.computeBoundingBox(); return g.boundingBox!; };

describe('Khaki Field dial', () => {
  const layers = hamiltonDial(m);
  const disc = layers.find((l) => l.material === 'dial')!;
  const hits = (x: number, y: number) => {
    const mesh = new THREE.Mesh(disc.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    return new THREE.Raycaster(new THREE.Vector3(x, y, -10), new THREE.Vector3(0, 0, 1)).intersectObject(mesh).length;
  };
  it('cuts the date window over the movement\'s date ring at 3 o\'clock', () => {
    const w = dateWindow(m);
    expect(w.x).toBe(m.dateWindow!.x);
    expect(hits(w.x, 0)).toBe(0);
    expect(hits(w.x + w.w / 2 + 0.1, 0)).toBeGreaterThan(0);
    expect(hits(-w.x, 0)).toBeGreaterThan(0);
  });
  it('frames the window with an applied frame on the dial', () => {
    const f = bbox(layers.find((l) => l.name === 'date-frame')!.geometry);
    const w = dateWindow(m);
    expect(f.max.x - f.min.x).toBeCloseTo(w.w + 2 * H.dateFrame, 2);
    expect(f.max.y - f.min.y).toBeCloseTo(w.h + 2 * H.dateFrame, 2);
    expect(f.max.z).toBeLessThanOrEqual(m.dialZ);
  });
  it('keeps the frame behind the hour hand that sweeps over it at 3 o\'clock', () => {
    const f = bbox(layers.find((l) => l.name === 'date-frame')!.geometry);
    const hourZ = caliber.parts.find((p) => p.id === 'hour-hand')!.pos.z;
    expect(f.min.z).toBeGreaterThan(hourZ + 0.03);
  });
  it('faces the front and runs under the flange', () => {
    const b = bbox(disc.geometry);
    expect(b.max.x).toBeCloseTo(H.dialRadius, 2);
    expect(H.dialRadius).toBeGreaterThan(H.flangeInner);
    expect(disc.geometry.getAttribute('normal').getZ(0)).toBeLessThan(0);
  });
  it('sets twelve lume dots on the minute track, one per hour', () => {
    const dots = layers.filter((l) => l.material === 'dial-lume');
    expect(dots).toHaveLength(12);
    for (const d of dots) {
      const c = bbox(d.geometry).getCenter(new THREE.Vector3());
      expect(Math.hypot(c.x, c.y)).toBeCloseTo(H.lumeDotAt, 2);
    }
  });
  it('prints hours without the 3, the 24 h ring and the five-minute numbers', () => {
    const p = dialPrint();
    expect(p.hours).toEqual(['12', '1', '2', '', '4', '5', '6', '7', '8', '9', '10', '11']);
    expect(p.day[0]).toBe('24');
    expect(p.day[3]).toBe('15');
    expect(p.minutes).toEqual(['60', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);
  });
});
