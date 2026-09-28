import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { materialKeys, resolveMaterial } from './materials';

describe('resolveMaterial', () => {
  const own = { case: new THREE.MeshBasicMaterial(), lume: new THREE.MeshBasicMaterial() };
  const shared = { lume: new THREE.MeshBasicMaterial(), steel: new THREE.MeshBasicMaterial() };
  it('prefers the build\'s own material over a shared one', () => {
    expect(resolveMaterial('lume', own, shared)).toBe(own.lume);
    expect(resolveMaterial('steel', own, shared)).toBe(shared.steel);
  });
  it('throws on unknown keys, naming the key', () => {
    expect(() => resolveMaterial('ceramic', own, shared)).toThrow(/ceramic/);
  });
  it('lists every key a set of layers uses, including group arrays', () => {
    const g = new THREE.BufferGeometry();
    expect(materialKeys([{ geometry: g, material: 'case' }, { geometry: g, material: ['a', 'b', 'a'] }]).sort()).toEqual(['a', 'b', 'case']);
  });
});
