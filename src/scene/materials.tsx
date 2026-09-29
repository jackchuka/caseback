import { createContext, useContext, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import type { MovementMaterial } from '../geometry/parts';
import { lumeMaterial } from './lume';
import { cotesDeGeneve, dateNumbers, dayNames, perlage, sunburst } from './textures';

export type MaterialSet = Record<MovementMaterial, THREE.MeshPhysicalMaterial>;

export function createMaterials(): MaterialSet {
  const cotes = cotesDeGeneve();
  const pearl = perlage();
  const sun = sunburst();
  const dates = dateNumbers();
  const days = dayNames();
  dates.wrapS = dates.wrapT = days.wrapS = days.wrapT = THREE.ClampToEdgeWrapping;
  return {
    gilt: new THREE.MeshPhysicalMaterial({ color: 0xe8c07a, metalness: 1, roughness: 0.22, bumpMap: sun, bumpScale: 0.25, clearcoat: 0.3, clearcoatRoughness: 0.2 }),
    steel: new THREE.MeshPhysicalMaterial({ color: 0xeef0f3, metalness: 1, roughness: 0.22 }),
    rhodium: new THREE.MeshPhysicalMaterial({ color: 0xc4c8ce, metalness: 1, roughness: 0.22, roughnessMap: cotes, bumpMap: cotes, bumpScale: 0.35 }),
    plate: new THREE.MeshPhysicalMaterial({ color: 0xa9adb3, metalness: 1, roughness: 0.42, roughnessMap: pearl, bumpMap: pearl, bumpScale: 0.3 }),
    balance: new THREE.MeshPhysicalMaterial({ color: 0xf0d59a, metalness: 1, roughness: 0.16 }),
    // Opaque on purpose: a transmissive jewel makes three.js render the whole scene twice every frame, and at this
    // size the refraction never read anyway.
    ruby: new THREE.MeshPhysicalMaterial({ color: 0x8a0020, metalness: 0, roughness: 0.03, ior: 1.76, clearcoat: 1, sheen: 0.6, sheenColor: 0xff3050 }),
    blued: new THREE.MeshPhysicalMaterial({ color: 0x1b3aa8, metalness: 1, roughness: 0.18, iridescence: 0.5, iridescenceIOR: 1.6 }),
    slot: new THREE.MeshPhysicalMaterial({ color: 0x050a1a, metalness: 0.5, roughness: 0.6 }),
    lume: lumeMaterial(),
    date: new THREE.MeshPhysicalMaterial({ map: dates, roughness: 0.45, clearcoat: 0.4 }),
    day: new THREE.MeshPhysicalMaterial({ map: days, roughness: 0.45, clearcoat: 0.4 }),
  };
}

const MaterialsContext = createContext<MaterialSet | null>(null);

export function MaterialsProvider({ children }: { children: ReactNode }) {
  const set = useMemo(createMaterials, []);
  return <MaterialsContext.Provider value={set}>{children}</MaterialsContext.Provider>;
}

export function useMaterials(): MaterialSet {
  const m = useContext(MaterialsContext);
  if (!m) throw new Error('useMaterials outside MaterialsProvider');
  return m;
}
