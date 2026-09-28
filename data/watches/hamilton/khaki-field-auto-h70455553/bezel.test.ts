import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { bezelProfile, bezelTop, hamiltonBezel } from './bezel';
import { caseFront } from './case';
import { H } from './params';

const m = movementFrame(calibers['eta-2824-2']!);
const bbox = (g: THREE.BufferGeometry) => { g.computeBoundingBox(); return g.boundingBox!; };

describe('Khaki Field bezel', () => {
  const layers = hamiltonBezel(m);
  const body = layers.find((l) => l.name === 'bezel')!;
  it('is a polished ring from the lip to inside the brushed case top', () => {
    expect(body.material).toBe('polished');
    const b = bbox(body.geometry);
    expect(b.max.x).toBeCloseTo(H.bezelOuter, 2);
    expect(b.max.x).toBeLessThan(H.caseRadius - 0.5);
  });
  it('stands on the case front, its lip frontmost', () => {
    const b = bbox(body.geometry);
    expect(b.max.z).toBeLessThanOrEqual(caseFront(m));
    expect(b.min.z).toBeCloseTo(bezelTop(m), 5);
  });
  it('slopes down from the lip to the outer edge, steepening outward', () => {
    const slope = bezelProfile(m).filter(([r, z]) => r >= H.bezelChamfer && r < H.bezelOuter - 0.05 && z < caseFront(m) - 0.05);
    for (let i = 1; i < slope.length; i++) expect(slope[i]![1]).toBeGreaterThan(slope[i - 1]![1]);
    const drop = (i: number) => (slope[i + 1]![1] - slope[i]![1]) / (slope[i + 1]![0] - slope[i]![0]);
    expect(drop(slope.length - 2)).toBeGreaterThan(drop(0));
  });
  it('closes the wall from the dial edge to the case front with a flange', () => {
    const f = bbox(layers.find((l) => l.name === 'flange')!.geometry);
    expect(f.max.z).toBeCloseTo(m.dialZ - 0.02, 5);
    expect(f.max.x).toBeCloseTo(H.bezelInner, 2);
    expect(f.min.z).toBeLessThan(caseFront(m));
  });
});
