import type * as THREE from 'three';
import type { Part } from '../model/schema';

export type RegistryEntry = { group: THREE.Group; materials: THREE.MeshPhysicalMaterial[]; part: Part };

export const registry = new Map<string, RegistryEntry>();
