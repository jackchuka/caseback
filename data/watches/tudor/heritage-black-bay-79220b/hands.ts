import * as THREE from 'three';
import type { HandLayer } from '../../../../src/scene/exterior/contract';
import { T } from './params';

type P = [number, number];
const H = T.hands;

// A hand's outline is a list of points on its right half (x ≥ 0), from the tail to the tip; mirroring closes it.
const mirror = (half: P[]): P[] => [...half, ...half.slice(0, -1).reverse().filter(([x]) => x > 0).map(([x, y]): P => [-x, y])];

const shape = (pts: P[]) => {
  const s = new THREE.Shape();
  pts.forEach(([x, y], k) => (k === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
};

// A flat plate whose front (−Z) face is at z − thickness, with an optional bevel on its rim.
function plate(pts: P[], thickness: number, z: number, bevel = 0) {
  const bt = Math.min(bevel, thickness / 3);
  const g = new THREE.ExtrudeGeometry(shape(pts), { depth: thickness - 2 * bt, bevelEnabled: bevel > 0, bevelThickness: bt, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 1, curveSegments: 1 });
  return g.translate(0, 0, z - thickness + bt);
}

// The polished frame around a lume window, rounded to a ridge across its whole width. A flat frame faces the camera
// and mirrors the dark behind it; a rounded one turns some part of its section to every softbox in the studio.
function frame(outline: P[], window: P[], z: number, height: number) {
  const s = shape(outline);
  s.holes.push(shape(window));
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.001, bevelEnabled: true, bevelThickness: height / 2, bevelSize: height / 2, bevelOffset: -height / 2, bevelSegments: 5, curveSegments: 1 });
  return g.translate(0, 0, z - 0.001 - height / 2);
}
const hub = (r: number, z: number) => new THREE.CylinderGeometry(r, r, 0.2, 40).rotateX(Math.PI / 2).translate(0, 0, z);

// Where a diamond with half-diagonals (along, across) centred at −c on the axis meets a strip of half-width w.
const diamondAt = (c: number, along: number, across: number, w: number, side: 1 | -1): P => [w, -(c + side * along * (1 - w / across))];

// The hour hand: a shaft into a diamond lume plate, then a short pointed tip. The lume runs the whole length.
function snowflake(len: number, c: number, along: number, across: number, shaft: number, tip: number, back: number): P[] {
  return mirror([
    [shaft, back],
    diamondAt(c, along, across, shaft, -1),
    [across, -c],
    diamondAt(c, along, across, tip, 1),
    [tip, -(len - tip * 1.2)],
    [0, -len],
  ]);
}

// Tudor's snowflake set: an hour hand with a large diamond lume plate, a straight sword minute hand, and a thin
// seconds hand with a diamond plate and a plain counterweight. Hands point to −Y and pivot at the origin.
export function tudorHands(dialRadius: number) {
  const F = H.frame;
  const hL = T.hour * dialRadius, mL = T.minute * dialRadius, sL = T.seconds * dialRadius;
  const c = H.snowflakeAt * dialRadius, al = H.snowflakeLength, ac = T.snowflake;
  // Insetting a diamond by F shrinks both half-diagonals by the same factor.
  const k = 1 - (F * Math.hypot(al, ac)) / (al * ac);
  const hourWindow = snowflake(hL - F * 1.3, c, al * k, ac * k, H.hourShaft - F, H.hourTip - F, -H.lumeFrom);
  const hour: HandLayer[] = [
    { geometry: frame(snowflake(hL, c, al, ac, H.hourShaft, H.hourTip, 1.2), hourWindow, 0, H.ridge), material: 'steel' },
    { geometry: plate(hourWindow, H.ridge - 0.08, -0.02), material: 'lume' },
    { geometry: hub(1.0, -0.1), material: 'steel' },
  ];
  const mw = H.minuteWidth / 2, point = mw * 1.6;
  const minuteWindow = mirror([[mw - F, -H.lumeFrom - 0.4], [mw - F, -(mL - point)], [0, -(mL - F * 2.5)]]);
  const minute: HandLayer[] = [
    { geometry: frame(mirror([[mw * 0.8, 2], [mw, -1.2], [mw, -(mL - point)], [0, -mL]]), minuteWindow, 0, H.ridge), material: 'steel' },
    { geometry: plate(minuteWindow, H.ridge - 0.08, -0.02), material: 'lume' },
    { geometry: hub(0.85, -0.1), material: 'steel' },
  ];
  const sc = H.secondsPlateAt * dialRadius, q = T.secondsPlate, sw = H.secondsShaft / 2, tail = T.secondsTail * dialRadius;
  const secondsWindow: P[] = [[0, -(sc - q + F)], [q - F, -sc], [0, -(sc + q - F)], [-(q - F), -sc]];
  const seconds: HandLayer[] = [
    { geometry: plate(mirror([[H.counterweight, tail], [sw, 0], [sw, -sL + 0.3], [0, -sL]]), 0.1, 0, 0.03), material: 'steel' },
    { geometry: frame([[0, -(sc - q)], [q, -sc], [0, -(sc + q)], [-q, -sc]], secondsWindow, 0, 0.12), material: 'steel' },
    { geometry: plate(secondsWindow, 0.08, -0.01), material: 'lume' },
    { geometry: hub(0.55, -0.1), material: 'steel' },
  ];
  return { hour, minute, seconds };
}
