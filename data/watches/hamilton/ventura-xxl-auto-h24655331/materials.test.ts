import { describe, expect, it } from 'vitest';
import type * as THREE from 'three';
import { venturaMaterials } from './materials';

describe('Ventura materials', () => {
  it('cuts the grille by alpha test so the movement shows through without sorting', () => {
    const own = venturaMaterials();
    expect(Object.keys(own)).not.toContain('dial-lume');
    expect(own['crystal']!().transparent).toBe(true);
    const make = own['dial-grille']!;
    // The grille's mask paints on a canvas; the test environment has none, so only check the material's recipe.
    expect(make.toString()).toContain('alphaTest');
  });
  it('keeps the case metal opaque', () => {
    expect((venturaMaterials()['case']!() as THREE.MeshPhysicalMaterial).transparent).toBe(false);
  });
});
