import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { layersBox } from '../../../../src/test/geometry';
import { crystalFront, sinnBezel, sinnCrystal } from './bezel';
import { bezelTop, caseFront } from './case';
import { S } from './params';

const m = movementFrame(calibers['eta-2824-2']!);

describe('Sinn 556 bezel and crystal', () => {
  const layers = sinnBezel(m);
  const body = layers.find((l) => l.material === 'bezel')!;
  it('is as wide as the drum and sits on the case front', () => {
    const b = layersBox([body]);
    expect(b.max.x).toBeCloseTo(S.caseRadius, 2);
    expect(b.max.z).toBeLessThanOrEqual(caseFront(m) + 0.01);
    expect(b.min.z).toBeCloseTo(bezelTop(m), 5);
  });
  it('has a flat top from its chamfer out to the rounded edge', () => {
    const p = body.geometry.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const r = Math.hypot(p.getX(i), p.getY(i));
      if (r > S.bezelFlat + 0.05 && r < S.bezelOuter - S.bezelEdge - 0.05) expect(p.getZ(i)).toBeCloseTo(bezelTop(m), 5);
    }
  });
  it('sets the flat crystal down the chamfer, in front of the dial', () => {
    const c = layersBox(sinnCrystal(m));
    expect(c.min.z).toBeCloseTo(crystalFront(m), 5);
    expect(c.min.z - bezelTop(m)).toBeCloseTo(S.crystalDrop, 5);
    expect(c.max.x).toBeLessThanOrEqual(S.crystalRadius);
    expect(c.max.z).toBeLessThan(m.dialZ - 0.5);
  });
  it('closes the gap between the dial edge and the case front with a flange facing the centre', () => {
    const g = layers.find((l) => l.name === 'flange')!.geometry;
    const b = layersBox([{ geometry: g }]);
    expect(b.max.z).toBeCloseTo(m.dialZ, 1);
    expect(b.min.z).toBeCloseTo(caseFront(m), 1);
    g.computeVertexNormals();
    const p = g.getAttribute('position'), n = g.getAttribute('normal');
    for (let i = 0; i < p.count; i += 17) expect(p.getX(i) * n.getX(i) + p.getY(i) * n.getY(i)).toBeLessThan(0);
  });
});

describe('Sinn 556 bezel shading', () => {
  it('shades the flat top with axial normals, not like a doughnut', () => {
    const body = sinnBezel(m).find((l) => l.material === 'bezel')!.geometry;
    const p = body.getAttribute('position'), n = body.getAttribute('normal');
    let top = 0;
    for (let i = 0; i < p.count; i++) {
      if (Math.abs(p.getZ(i) - bezelTop(m)) > 1e-6) continue;
      // Each crease vertex has a twin facing the neighbouring face; only the top's own copies must face the front.
      if (Math.abs(n.getZ(i)) < 0.9) continue;
      top++;
      expect(n.getZ(i)).toBeCloseTo(-1, 5);
    }
    expect(top).toBeGreaterThanOrEqual(2 * 241);
  });
});
