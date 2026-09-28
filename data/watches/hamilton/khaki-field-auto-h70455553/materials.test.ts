import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';

// The movement's textures paint on a canvas, which the node test environment lacks; the colours don't need them.
vi.mock('../../../../src/scene/textures', () => {
  const tex = () => new THREE.Texture();
  return { cotesDeGeneve: tex, perlage: tex, sunburst: tex, dateNumbers: tex };
});

const { createMaterials } = await import('../../../../src/scene/materials');
const { hamiltonMaterials } = await import('./materials');

describe('Khaki Field materials', () => {
  it('paints the dial lume the colour of the movement lume the hands use', () => {
    const dial = hamiltonMaterials()['dial-lume']!() as THREE.MeshPhysicalMaterial;
    expect(dial.color.getHex()).toBe(createMaterials().lume.color.getHex());
  });
});
