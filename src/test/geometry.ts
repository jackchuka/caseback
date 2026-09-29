import { expect } from 'vitest';
import * as THREE from 'three';
import { buildShape } from '../geometry/parts';
import type { Caliber } from '../model/schema';
import { openingDuration, openingPose } from '../scene/opening';

type Layers = Array<{ geometry: THREE.BufferGeometry }>;

export const bbox = (g: THREE.BufferGeometry) => { g.computeBoundingBox(); return g.boundingBox!; };

export const layersBox = (ls: Layers) => {
  const b = new THREE.Box3();
  for (const l of ls) b.union(bbox(l.geometry));
  return b;
};

export const zRange = (ls: Layers, dz = 0) => {
  const b = layersBox(ls);
  return [b.min.z + dz, b.max.z + dz] as const;
};

// Each vertex's distance from the Z axis (the watch's centre line).
export const radii = (g: THREE.BufferGeometry) => {
  const p = g.getAttribute('position');
  return Array.from({ length: p.count }, (_, i) => Math.hypot(p.getX(i), p.getY(i)));
};

// The caliber's rotor: its depth span in watch coordinates and its radius.
export function rotorOf(caliber: Caliber) {
  const rotor = caliber.parts.find((p) => p.id === 'rotor')!;
  const [front, back] = zRange(buildShape(rotor.shape, rotor.material as never), rotor.pos.z);
  return { front, back, radius: rotor.shape.kind === 'rotor' ? rotor.shape.radius : NaN };
}

// Closed and throughout the opening, the rotor keeps `margin` in front of the caseback's floor and, given a pocket,
// inside its radius (coplanar or touching faces z-fight). Given the back's depth span, only the poses where the rotor
// overlaps it in depth are checked.
export function expectRotorClears(rotor: ReturnType<typeof rotorOf>, o: { floor: number; pocket?: number; span?: readonly [number, number]; margin?: number }) {
  const margin = o.margin ?? 0.05;
  expect(o.floor - rotor.back).toBeGreaterThanOrEqual(margin);
  if (o.pocket !== undefined) expect(o.pocket - rotor.radius).toBeGreaterThanOrEqual(margin);
  for (let t = 0; t <= openingDuration(); t += 0.01) {
    const p = openingPose(t);
    if (o.span && (rotor.back + p.rotorLift <= o.span[0] + p.casebackLift || rotor.front + p.rotorLift >= o.span[1] + p.casebackLift)) continue;
    expect(o.floor + p.casebackLift - (rotor.back + p.rotorLift)).toBeGreaterThanOrEqual(margin);
    if (o.pocket !== undefined) expect(o.pocket - (p.rotorSlide + rotor.radius)).toBeGreaterThanOrEqual(margin);
  }
}
