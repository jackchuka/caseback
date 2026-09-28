import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';

// The dial and grille paint on a canvas, which the node test environment lacks; the recipes don't need it.
vi.mock('../../../../src/scene/exterior/kit/canvas', () => ({ canvasTexture: () => new THREE.Texture() }));

const { venturaMaterials } = await import('./materials');

describe('Ventura materials', () => {
  const own = venturaMaterials();
  it('cuts the grille by alpha test, opaque, so the movement shows through without sorting', () => {
    const grille = own['dial-grille']!() as THREE.MeshPhysicalMaterial;
    expect(grille.alphaTest).toBeGreaterThan(0);
    expect(grille.alphaMap).not.toBeNull();
    expect(grille.transparent).toBe(false);
  });
  it('has no lume on the dial: the markers are polished and the hands steel', () => {
    expect(Object.keys(own)).not.toContain('dial-lume');
  });
  it('keeps the crystal transparent and the case metal opaque', () => {
    expect(own['crystal']!().transparent).toBe(true);
    expect(own['case']!().transparent).toBe(false);
  });
});
