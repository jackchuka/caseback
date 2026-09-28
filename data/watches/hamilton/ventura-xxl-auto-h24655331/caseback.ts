import * as THREE from 'three';
import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { outlineShape } from '../../../../src/scene/exterior/kit/outline';
import { caseBack } from './case';
import { V } from './params';
import { casebackPlan } from './plan';

const MIN: [number, number] = [-24, -25], MAX: [number, number] = [24, 25];
const STEP = 0.1;

export const casebackOuter = () => caseBack() + V.caseback.thickness;

// Screw positions: one in each of the plate's three corners (9 o'clock tip, upper and lower crown-side corners),
// set in along the corner's bisector so the head sits on the frame.
export function screwPositions(plate: THREE.Shape): Array<[number, number]> {
  const pts = plate.getPoints();
  const pick = (score: (p: THREE.Vector2) => number) => pts.reduce((a, b) => (score(b) > score(a) ? b : a));
  const corners = [pick((p) => -p.x), pick((p) => -p.y + p.x * 0.6), pick((p) => p.y + p.x * 0.6)];
  return corners.map((c) => {
    const len = Math.hypot(c.x, c.y);
    const inset = 1.6;
    return [c.x - (c.x / len) * inset, c.y - (c.y / len) * inset];
  });
}

// The display back: a steel plate shaped like the case's main tier, screwed on at its three corners, with a
// sapphire window notched on the crown side. It lifts straight off: it does not screw down.
export function venturaCaseback(): ExteriorLayer[] {
  const plan = casebackPlan();
  const plate = outlineShape(plan.plate, MIN, MAX, STEP);
  const window = outlineShape(plan.window, MIN, MAX, STEP);
  const holed = new THREE.Shape(plate.getPoints());
  holed.holes.push(new THREE.Path([...window.getPoints()].reverse()));
  const zi = caseBack(), zo = casebackOuter();
  const bevel = 0.3;
  const ring = new THREE.ExtrudeGeometry(holed, { depth: V.caseback.thickness - bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 2 })
    .translate(0, 0, zi);
  // The front bevel would stand behind the seat; clamp it onto the seat plane.
  const p = ring.getAttribute('position');
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.max(zi, p.getZ(i)));
  ring.computeVertexNormals();
  const { glass: t, recess } = V.caseback;
  const glass = new THREE.ExtrudeGeometry(new THREE.Shape(window.getPoints()), { depth: t, bevelEnabled: false }).translate(0, 0, zo - recess - t);
  const screws = screwPositions(plate).map(([x, y]) => ({
    geometry: new THREE.SphereGeometry(V.caseback.screwRadius, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.45, 1).rotateX(Math.PI / 2).translate(x, y, zo - 0.02),
    material: 'polished',
    name: 'caseback-screw',
  }));
  return [
    { geometry: ring, material: 'caseback-metal', name: 'caseback-plate' },
    { geometry: glass, material: 'caseback-glass', name: 'caseback-glass', castShadow: false },
    ...screws,
  ];
}
