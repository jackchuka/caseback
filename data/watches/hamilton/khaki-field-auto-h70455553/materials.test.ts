import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';

// The movement's textures paint on a canvas, which the node test environment lacks; the colours don't need them.
vi.mock('../../../../src/scene/textures', () => {
  const tex = () => new THREE.Texture();
  return { cotesDeGeneve: tex, perlage: tex, sunburst: tex, dateNumbers: tex, dayNames: tex };
});

// The dial paints on a canvas too.
vi.mock('../../../../src/scene/exterior/kit/canvas', () => ({ canvasTexture: () => new THREE.Texture() }));

const { createMaterials } = await import('../../../../src/scene/materials');
const { hamiltonMaterials } = await import('./materials');
const { H } = await import('./params');

const rgb = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

describe('Khaki Field materials', () => {
  it('paints the dial lume the colour of the movement lume the hands use', () => {
    const dial = hamiltonMaterials()['dial-lume']!() as THREE.MeshPhysicalMaterial;
    expect(dial.color.getHex()).toBe(createMaterials().lume.color.getHex());
  });
  it('paints the three dial zones a neutral silver, the hour ring lightest and the track darkest', () => {
    const hsl = (hex: string) => new THREE.Color(hex).getHSL({ h: 0, s: 0, l: 0 }, THREE.SRGBColorSpace);
    const { track, ring, centre } = H.dialZones;
    for (const c of [track, ring, centre]) {
      const [r, , b] = rgb(c);
      expect(Math.abs(b! - r!), c).toBeLessThanOrEqual(3);
      expect(hsl(c).s, c).toBeLessThan(0.05);
      expect(hsl(c).l, c).toBeGreaterThan(0.7);
    }
    expect(hsl(ring).l).toBeGreaterThan(hsl(centre).l);
    expect(hsl(centre).l).toBeGreaterThan(hsl(track).l);
  });
  it('gives the dial a brushed metal sheen: a sunray centre and turned rings, not flat paint', () => {
    const dial = hamiltonMaterials()['dial']!() as THREE.MeshPhysicalMaterial;
    // Part metal: fully metallic, it mirrors the dark studio and goes grey.
    expect(dial.metalness).toBeGreaterThanOrEqual(0.2);
    expect(dial.metalness).toBeLessThanOrEqual(0.5);
    expect(dial.roughness).toBeLessThan(0.4);
    expect(dial.anisotropy).toBeGreaterThan(0);
    expect(dial.anisotropyMap).not.toBeNull();
    // A direction map is data, not colour.
    expect(dial.anisotropyMap!.colorSpace).toBe(THREE.NoColorSpace);
  });
});
