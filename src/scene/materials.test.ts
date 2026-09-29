import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';

// The movement's textures paint on a canvas, which the node test environment lacks; these checks don't need them.
vi.mock('./textures', () => {
  const tex = () => new THREE.Texture();
  return { cotesDeGeneve: tex, perlage: tex, sunburst: tex, dateNumbers: tex, dayNames: tex };
});

const { createMaterials } = await import('./materials');
const { watches } = await import('../../data/watches');
const { glass } = await import('./exterior/kit/glass');
const { honourEnvMapIntensity } = await import('./envIntensity');

const luminance = (c: THREE.Color) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

describe('movement materials', () => {
  const m = createMaterials();
  // Watch hands are framed in this steel: a flat mirror reflects one direction of the studio and went black against
  // the dial; rough enough to gather the softboxes it reads as a bright silver outline, as in the photos.
  it('hand steel is bright, fully metallic and rough enough to catch the studio', () => {
    expect(m.steel.metalness).toBe(1);
    expect(luminance(m.steel.color)).toBeGreaterThan(0.8);
    expect(m.steel.roughness).toBeGreaterThanOrEqual(0.18);
    expect(m.steel.roughness).toBeLessThanOrEqual(0.35);
  });
  it('lume is a light, non-metal cream with a faint glow of its own colour', () => {
    expect(m.lume.metalness).toBe(0);
    expect(luminance(m.lume.color)).toBeGreaterThan(0.8);
    expect(m.lume.emissive.getHex()).toBe(m.lume.color.getHex());
    expect(m.lume.emissiveIntensity).toBeGreaterThan(0);
    expect(m.lume.emissiveIntensity).toBeLessThan(0.3);
  });
  for (const w of Object.values(watches)) {
    const make = w.exterior.materials()['dial-lume'];
    if (!make) continue;
    it(`${w.id}: dial lume matches the hands' lume`, () => {
      const d = make() as THREE.MeshPhysicalMaterial;
      expect(d.color.getHex()).toBe(m.lume.color.getHex());
      expect(d.emissive.getHex()).toBe(m.lume.emissive.getHex());
      expect(d.emissiveIntensity).toBe(m.lume.emissiveIntensity);
      expect(d.roughness).toBe(m.lume.roughness);
    });
  }
});

describe('environment strength', () => {
  it('carries envMapIntensity to the shader, which scene.environment would otherwise override', () => {
    const s = honourEnvMapIntensity(new THREE.MeshPhysicalMaterial({ envMapIntensity: 1.4 }));
    expect(s.defines?.ENV_SCALE).toBe('1.4000');
    expect(THREE.ShaderChunk.envmap_physical_pars_fragment).toContain('envMapIntensity * ENV_SCALE');
    expect(honourEnvMapIntensity(new THREE.MeshPhysicalMaterial()).defines?.ENV_SCALE).toBeUndefined();
  });
  // Watch crystals are anti-reflective coated: at full strength the studio's panels veiled whole dials.
  it('keeps crystal reflections a fraction of bare sapphire\'s', () => {
    for (const t of [0, 1.2, 1.5]) {
      const g = glass(t);
      expect(g.envMapIntensity).toBeLessThan(0.3);
      expect(Number(g.defines?.ENV_SCALE)).toBeCloseTo(g.envMapIntensity, 3);
    }
  });
});
