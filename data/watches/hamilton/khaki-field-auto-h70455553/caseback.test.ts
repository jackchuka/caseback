import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { radii } from '../../../../src/test/geometry';
import { hamiltonCaseback } from './caseback';
import { H } from './params';

const m = movementFrame(calibers['eta-2824-2']!);

describe('Khaki Field display caseback', () => {
  const layers = hamiltonCaseback(m);
  const ring = layers.find((l) => l.name === 'caseback-ring')!.geometry;
  const p = ring.getAttribute('position');
  const r = radii(ring);
  it('shows the movement through a sapphire window named for the glass hit test', () => {
    const glass = layers.find((l) => l.name === 'caseback-glass')!;
    expect(glass.material).toBe('caseback-glass');
    glass.geometry.computeBoundingBox();
    expect(glass.geometry.boundingBox!.max.x).toBeCloseTo(H.casebackWindow, 1);
  });
  it('is a steel ring from the window out to its rim', () => {
    expect(Math.min(...r)).toBeCloseTo(H.casebackWindow, 1);
    expect(Math.max(...r)).toBeCloseTo(H.casebackRadius, 1);
  });
  it('cuts six wrench notches into the rim', () => {
    const notchFloor = H.casebackRadius - H.casebackNotch.depth;
    const angles = new Set<number>();
    for (let i = 0; i < p.count; i++) {
      if (Math.abs(r[i]! - notchFloor) < 0.25) angles.add((Math.round((Math.atan2(p.getY(i), p.getX(i)) * 6) / (2 * Math.PI)) + 6) % 6);
    }
    expect([...angles].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);
  });
  it('builds plain, non-interleaved attributes a worker can transfer', () => {
    for (const l of layers) expect(l.geometry.getAttribute('position')).toBeInstanceOf(THREE.BufferAttribute);
  });
});
