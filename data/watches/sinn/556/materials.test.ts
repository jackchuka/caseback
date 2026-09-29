import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';

// The dial and the date disc paint on a canvas, which the node test environment lacks; the recipes don't need it.
vi.mock('../../../../src/scene/exterior/kit/canvas', () => ({ canvasTexture: () => new THREE.Texture() }));
const printed: unknown[] = [];
vi.mock('../../../../src/scene/textures', () => ({
  dateNumbers: (_n: number, print: unknown) => (printed.push(print), new THREE.Texture()),
  dayNames: () => new THREE.Texture(),
}));

const { sinnMaterials } = await import('./materials');
const { DISC_MATERIALS } = await import('../../../../src/scene/exterior/contract');

const lightness = (hex: string) => new THREE.Color(hex).getHSL({ h: 0, s: 0, l: 0 }, THREE.SRGBColorSpace).l;

describe('Sinn 556 materials', () => {
  const own = sinnMaterials();
  it('prints its date white on a black disc, like the black dial (Worn & Wound: "white text on a black disk")', () => {
    expect(DISC_MATERIALS).toContain('date');
    const date = own['date']!();
    expect(date).toBeInstanceOf(THREE.MeshPhysicalMaterial);
    const print = printed.at(-1) as { ground: string; ink: string };
    expect(lightness(print.ground)).toBeLessThan(0.1);
    expect(lightness(print.ink)).toBeGreaterThan(0.9);
  });
  it('has no day disc: the 2824-2 is a date-only calibre', () => {
    expect(Object.keys(own)).not.toContain('day');
  });
});
