import * as THREE from 'three';
import type { ExteriorGeometry } from './contract';

type PackedAttribute = { array: THREE.TypedArray; itemSize: number; normalized: boolean };
export type PackedGeometry = {
  attributes: Record<string, PackedAttribute>;
  index: THREE.TypedArray | null;
  groups: Array<{ start: number; count: number; materialIndex?: number }>;
};
type Packed<T> = T extends THREE.BufferGeometry ? PackedGeometry : T extends object ? { [K in keyof T]: Packed<T[K]> } : T;
export type PackedExterior = Packed<ExteriorGeometry>;

function packGeometry(g: THREE.BufferGeometry, transfer: Set<ArrayBuffer>): PackedGeometry {
  const attributes: Record<string, PackedAttribute> = {};
  for (const [name, a] of Object.entries(g.attributes)) {
    // Interleaved attributes would need their shared buffer rebuilt; no builder produces them.
    if (!(a instanceof THREE.BufferAttribute)) throw new Error(`attribute ${name} is interleaved`);
    attributes[name] = { array: a.array, itemSize: a.itemSize, normalized: a.normalized };
    transfer.add(a.array.buffer as ArrayBuffer);
  }
  if (g.index) transfer.add(g.index.array.buffer as ArrayBuffer);
  return { attributes, index: g.index?.array ?? null, groups: g.groups.map((gr) => ({ ...gr })) };
}

function unpackGeometry(p: PackedGeometry): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  for (const [name, a] of Object.entries(p.attributes)) g.setAttribute(name, new THREE.BufferAttribute(a.array, a.itemSize, a.normalized));
  if (p.index) g.setIndex(new THREE.BufferAttribute(p.index, 1));
  for (const gr of p.groups) g.addGroup(gr.start, gr.count, gr.materialIndex);
  return g;
}

// Walks the build's plain-object tree, swapping each BufferGeometry for its typed arrays and back.
function mapGeometries(value: unknown, fn: (g: never) => unknown, isGeometry: (v: object) => boolean): unknown {
  if (Array.isArray(value)) return value.map((v) => mapGeometries(v, fn, isGeometry));
  if (value && typeof value === 'object') {
    if (isGeometry(value)) return fn(value as never);
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapGeometries(v, fn, isGeometry)]));
  }
  return value;
}

export function packExterior(b: ExteriorGeometry): { packed: PackedExterior; transfer: ArrayBuffer[] } {
  const transfer = new Set<ArrayBuffer>();
  const packed = mapGeometries(b, (g: THREE.BufferGeometry) => packGeometry(g, transfer), (v) => v instanceof THREE.BufferGeometry) as PackedExterior;
  return { packed, transfer: [...transfer] };
}

export function unpackExterior(p: PackedExterior): ExteriorGeometry {
  return mapGeometries(p, unpackGeometry, (v) => 'attributes' in v && 'groups' in v) as ExteriorGeometry;
}
