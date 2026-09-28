import * as THREE from 'three';
import type { HandLayer } from '../../../../src/scene/exterior/contract';
import { handHub, handShape, mirror, type P as P2 } from '../../../../src/scene/exterior/kit/hands';
import { P } from './params';

// Turns every triangle to face the viewer (−Z): a roof of facets has no face that should point away.
function faceFront(g: THREE.BufferGeometry) {
  const p = g.getAttribute('position');
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    if (b.clone().sub(a).cross(c.clone().sub(a)).z > 0) {
      p.setXYZ(i + 1, c.x, c.y, c.z);
      p.setXYZ(i + 2, b.x, b.y, b.z);
    }
  }
  g.computeVertexNormals();
  return g;
}

// A dauphine hand: a flat blade of `base` thickness under two facets that rise to a ridge along its axis. `half` is
// its right edge (x ≥ 0) from tail to tip; the tip ends on the axis.
function dauphine(half: P2[], base: number, ridge: number): THREE.BufferGeometry[] {
  const blade = new THREE.ExtrudeGeometry(handShape(mirror(half)), { depth: base, bevelEnabled: false }).translate(0, 0, -base);
  const tris: number[] = [];
  const top = -base;
  for (const side of [1, -1]) {
    for (let i = 0; i < half.length - 1; i++) {
      const [x0, y0] = half[i]!, [x1, y1] = half[i + 1]!;
      const e0 = [side * x0, y0, top], e1 = [side * x1, y1, top];
      const r0 = [0, y0, top - ridge * Math.min(1, x0 / 0.3)], r1 = [0, y1, top - ridge * Math.min(1, x1 / 0.3)];
      tris.push(...e0, ...r1, ...r0);
      // At the tip the edge meets the ridge: one triangle, not a quad.
      if (x1 > 0) tris.push(...e0, ...e1, ...r1);
    }
  }
  const roof = new THREE.BufferGeometry();
  roof.setAttribute('position', new THREE.Float32BufferAttribute(tris, 3));
  return [blade, faceFront(roof)];
}

// The Cocktail Time's hands: long faceted dauphine hour and minute hands in polished steel, and a blued needle
// seconds hand whose tail carries an open lozenge. Hands point to −Y and pivot at the origin.
export function presageHands(dialRadius: number) {
  const hL = P.hour * dialRadius, mL = P.minute * dialRadius, sL = P.seconds * dialRadius;
  const blade = (L: number, w: number): P2[] => [[0.45, 1.6], [w / 2, -0.16 * L], [0, -L]];
  const hour: HandLayer[] = [...dauphine(blade(hL, P.hourWidth), 0.08, P.handRidge).map((geometry) => ({ geometry, material: 'steel' as const })), { geometry: handHub(1.05, -0.1), material: 'steel' }];
  const minute: HandLayer[] = [...dauphine(blade(mL, P.minuteWidth), 0.08, P.handRidge).map((geometry) => ({ geometry, material: 'steel' as const })), { geometry: handHub(0.85, -0.1), material: 'steel' }];
  const L = P.lozenge;
  const c = L.at * dialRadius;
  const tail = P.secondsTail * dialRadius;
  const needle = new THREE.ExtrudeGeometry(handShape([[-0.13, tail], [0.13, tail], [0.09, -sL + 0.2], [0, -sL], [-0.09, -sL + 0.2]]), { depth: 0.07, bevelEnabled: false }).translate(0, 0, -0.07);
  const lozenge = handShape([[0, c - L.along], [L.across, c], [0, c + L.along], [-L.across, c]]);
  const band = 0.16;
  lozenge.holes.push(handShape([[0, c - L.along + band * 1.8], [-(L.across - band), c], [0, c + L.along - band * 1.8], [L.across - band, c]]));
  const seconds: HandLayer[] = [
    { geometry: needle, material: 'blued' },
    { geometry: new THREE.ExtrudeGeometry(lozenge, { depth: 0.07, bevelEnabled: false }).translate(0, 0, -0.07), material: 'blued' },
    { geometry: handHub(0.5, -0.1), material: 'blued' },
  ];
  return { hour, minute, seconds };
}
