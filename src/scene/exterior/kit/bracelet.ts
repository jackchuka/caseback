import * as THREE from 'three';
import type { ExteriorLayer } from '../contract';
import { bend, flipWinding } from './bend';
import { extrudeProfile, smax } from './sdf';
import { surfaceNets, type Sdf } from './surfaceNets';

export type BraceletSpec = {
  startWidth: number; endWidth: number; pitch: number; centerRatio: number; thickness: number;
  links: number; gap: number; wristRadius: number; centerRaise: number;
  // Chamfer: how far the top face's bevel cuts back from each side edge. Crown: how far the top face's centre
  // bulges outward past its edges (0 for a flat top).
  chamfer: number; crown: number;
};

// One link piece's cross-section (width x thickness), constant along its length: a chamfered top edge on both
// sides and, between them, a shallow outward crown so the top face reads as domed rather than flat. `z` is local
// depth, more negative toward the outward (visible) face, matching how callers offset a piece with `dz`. Exported
// so tests can pin the chamfer/crown shape directly, without the wrist bend's curvature confounding it.
export function plateProfile(width: number, thickness: number, chamfer: number, crown: number, archSegments = 6): Array<[number, number]> {
  const hw = width / 2, hz = thickness / 2;
  const innerHw = Math.max(0, hw - chamfer);
  const topZ = (x: number) => -hz - crown * (1 - (x / hw) ** 2);
  const pts: Array<[number, number]> = [[-hw, hz], [-hw, topZ(-innerHw) + chamfer]];
  for (let i = 0; i <= archSegments; i++) pts.push([-innerHw + (2 * innerHw * i) / archSegments, topZ(-innerHw + (2 * innerHw * i) / archSegments)]);
  pts.push([hw, topZ(innerHw) + chamfer], [hw, hz]);
  return pts;
}

// Sweeps a closed (width, depth) profile along Y from -len/2 to len/2: an indexed tube (profile vertices shared
// around the ring, so the chamfer and crown shade smoothly) capped by two unshared fans (flat-shaded, since a
// link's end butts against a real gap, not a soft edge).
function extrudePlate(profile: Array<[number, number]>, len: number): THREE.BufferGeometry {
  const n = profile.length;
  const hl = len / 2;
  const positions: number[] = [];
  for (const y of [-hl, hl]) for (const [x, z] of profile) positions.push(x, y, z);
  const indices: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = i, b = (i + 1) % n, c = n + ((i + 1) % n), d = n + i;
    indices.push(a, c, b, a, d, c);
  }
  const cap = (y: number, reverse: boolean) => {
    const start = positions.length / 3;
    for (const [x, z] of profile) positions.push(x, y, z);
    for (let i = 1; i < n - 1; i++) {
      if (reverse) indices.push(start, start + i, start + i + 1);
      else indices.push(start, start + i + 1, start + i);
    }
  };
  cap(-hl, true);
  cap(hl, false);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

// A three-piece-link bracelet running from the 12 and 6 o'clock lugs toward the wrist. Links narrow evenly from the
// lugs to the far end; the centre piece stands a little proud, as on Oyster-type bracelets.
export function bracelet(s: BraceletSpec, start: { y: number; z: number }, material: { center: string; outer: string }): ExteriorLayer[] {
  const layers: ExteriorLayer[] = [];
  for (const dir of [1, -1] as const) {
    for (let i = 0; i < s.links; i++) {
      const w = s.startWidth + ((s.endWidth - s.startWidth) * i) / Math.max(1, s.links - 1);
      const cw = w * s.centerRatio;
      const ow = (w - cw) / 2 - s.gap;
      const len = s.pitch - s.gap;
      // Trailing gap per link, not split around it, so the first link's near edge sits exactly at start.y.
      const y = start.y + i * s.pitch + len / 2;
      const piece = (width: number, x: number, dz: number, name: string, mat: string) => {
        let g: THREE.BufferGeometry = extrudePlate(plateProfile(width, s.thickness, s.chamfer, s.crown), len).translate(x, y, start.z + dz);
        if (dir < 0) g = flipWinding(g.scale(1, -1, 1));
        layers.push({ geometry: bend(g, s.wristRadius, start.y, dir), material: mat, name });
      };
      piece(ow, -(cw / 2 + s.gap + ow / 2), 0, 'bracelet-outer', material.outer);
      piece(cw, 0, -s.centerRaise, 'bracelet-center', material.center);
      piece(ow, cw / 2 + s.gap + ow / 2, 0, 'bracelet-outer', material.outer);
    }
  }
  return layers;
}

// An H-link bracelet: in every pitch the outer rails run the full length and a crossbar joins them, flush, at the far
// end; the near end leaves an opening that a separate centre link fills. `bar` is the crossbar's length along the
// bracelet; `centerRaise` lifts the centre link above the H (0: flush).
export type HLinkSpec = BraceletSpec & { bar: number };

export function hLinkBracelet(s: HLinkSpec, start: { y: number; z: number }, material: { center: string; outer: string }): ExteriorLayer[] {
  const layers: ExteriorLayer[] = [];
  for (const dir of [1, -1] as const) {
    for (let i = 0; i < s.links; i++) {
      const w = s.startWidth + ((s.endWidth - s.startWidth) * i) / Math.max(1, s.links - 1);
      const cw = w * s.centerRatio;
      const ow = (w - cw) / 2;
      const y0 = start.y + i * s.pitch;
      const link = s.pitch - s.bar - 2 * s.gap;
      const piece = (width: number, x: number, from: number, len: number, dz: number, name: string, mat: string) => {
        let g: THREE.BufferGeometry = extrudePlate(plateProfile(width, s.thickness, s.chamfer, s.crown), len).translate(x, from + len / 2, start.z + dz);
        if (dir < 0) g = flipWinding(g.scale(1, -1, 1));
        layers.push({ geometry: bend(g, s.wristRadius, start.y, dir), material: mat, name });
      };
      const rail = s.pitch - s.gap;
      piece(ow, -(cw + ow) / 2, y0, rail, 0, 'bracelet-outer', material.outer);
      piece(ow, (cw + ow) / 2, y0, rail, 0, 'bracelet-outer', material.outer);
      // Overlaps the rails a little so the H reads as one piece.
      piece(cw + 0.2, 0, y0 + link + s.gap, s.bar, 0.01, 'bracelet-bar', material.outer);
      piece(cw - 2 * s.gap, 0, y0, link, -s.centerRaise, 'bracelet-center', material.center);
    }
  }
  return layers;
}

// Solid end links that fill the gap between the lugs (half-width `halfWidth`) from `from` out to `reach`, centred on
// the spring bar's height. They are tested against the case's own sdf, so they hug the drum and lug flanks with an
// exact clearance; `blend` softens that crease (0 leaves it sharp), or surface nets may saw it into teeth.
export function endLinks(caseSdf: Sdf, o: { z: number; halfWidth: number; thickness: number; chamfer: number; from: number; reach: number; blend: number; material: string }): ExteriorLayer[] {
  const CLEAR = 0.1;
  const lw = o.halfWidth, th = o.thickness;
  // Same edge treatment as the links they feed into, so the end link doesn't read as a sharper, flatter piece.
  const opts = { chamfer: o.chamfer, backChamfer: 0, edge: 0.15 };
  return ([1, -1] as const).map((dir) => {
    const sdf = (x: number, y: number, z: number) => {
      // z smaller than o.z is the outward (visible) face, matching the links' own convention.
      const plate = extrudeProfile(Math.abs(x) - lw, o.z - th / 2 - z, z - (o.z + th / 2), opts);
      const clear = CLEAR - caseSdf(x, y, z);
      return Math.max(o.blend > 0 ? smax(plate, clear, o.blend) : Math.max(plate, clear), y * dir - o.reach);
    };
    const far = o.reach + 0.5;
    const g = surfaceNets(sdf, [-lw - 0.5, dir > 0 ? o.from : -far, o.z - th], [lw + 0.5, dir > 0 ? far : -o.from, o.z + th], 0.15);
    return { geometry: g, material: o.material, name: 'end-link' };
  });
}
