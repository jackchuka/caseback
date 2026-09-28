import * as THREE from 'three';
import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import { cutFlutes } from '../../../../src/scene/exterior/kit/flutes';
import { lathe } from '../../../../src/scene/exterior/kit/lathe';
import { caseFront } from './case';
import { T } from './params';

export type BezelMark = { minute: number; kind: 'triangle' | 'tick' | 'bar' | 'numeral'; text?: string };

// The dive scale as printed on the 79220B insert: minute ticks for the first quarter hour, bars at the fives, tens as
// numerals. Every numeral stands with its top toward the rim, so 20, 30 and 40 read upside down from the front, as in
// the photos.
export function bezelMarks(): BezelMark[] {
  return Array.from({ length: 60 }, (_, minute): BezelMark | null => {
    if (minute === 0) return { minute, kind: 'triangle' };
    if (minute % 10 === 0) return { minute, kind: 'numeral', text: String(minute) };
    if (minute % 5 === 0) return { minute, kind: 'bar' };
    return minute < 15 ? { minute, kind: 'tick' } : null;
  }).filter((x): x is BezelMark => x !== null);
}

export const bezelTop = (m: MovementFrame) => caseFront(m) - T.bezelHeight;

export function tudorBezel(m: MovementFrame): ExteriorLayer[] {
  const b = caseFront(m);
  const top = bezelTop(m);
  const seat = top + 0.15;
  // The insert is a shallow cone: its inner edge by the crystal stands proud, dropping toward the coin edge.
  const slope = T.insertDrop / (T.insertOuter - T.insertInner);
  const drop = (r: number) => Math.max(0, r - T.insertInner) * slope;
  const rim = T.bezelOuter - 0.12, io = T.insertOuter + 0.05;
  // (radius, z), front is −Z: inner lip, recessed insert seat, sloping outer rim, coin-edged wall.
  const body = lathe([
    [T.bezelInner, b - 0.02], [T.bezelInner, top + 0.1], [T.bezelInner + 0.12, top],
    [T.insertInner - 0.05, top], [T.insertInner - 0.05, seat], [io, seat + drop(io)], [io, top + drop(io)],
    [rim, top + drop(rim)], [T.bezelOuter, top + drop(rim) + 0.12], [T.bezelOuter, b - 0.02], [T.bezelInner, b - 0.02],
  ], T.knurlCount * 4);
  cutFlutes(body, { axis: 'z', radius: T.bezelOuter, count: T.knurlCount, depth: T.knurlDepth, from: top + drop(rim) + 0.2, to: b - 0.1 });
  // RingGeometry's UVs come from x and y, so lifting each vertex onto the cone keeps the painted scale in register.
  const insert = new THREE.RingGeometry(T.insertInner, T.insertOuter, 360, 4).rotateX(Math.PI);
  const ip = insert.getAttribute('position');
  for (let i = 0; i < ip.count; i++) ip.setZ(i, seat - 0.01 + drop(Math.hypot(ip.getX(i), ip.getY(i))));
  insert.computeVertexNormals();
  const pipAt = -T.pipAt, pipSeat = seat + drop(T.pipAt);
  const cup = new THREE.CylinderGeometry(T.pipRadius + 0.18, T.pipRadius + 0.18, 0.3, 40).rotateX(Math.PI / 2).translate(0, pipAt, pipSeat - 0.15);
  const pip = new THREE.CylinderGeometry(T.pipRadius, T.pipRadius, 0.1, 40).rotateX(Math.PI / 2).translate(0, pipAt, pipSeat - 0.32);
  // The flange (rehaut) closes the wall between the dial's edge and the case front, which stands proud of the dial.
  const flange = new THREE.LatheGeometry([new THREE.Vector2(T.dialRadius, m.dialZ - 0.01), new THREE.Vector2(T.bezelInner, b)], 180).rotateX(Math.PI / 2);
  return [
    { geometry: body, material: 'polished' },
    { geometry: flange, material: 'polished', name: 'flange' },
    { geometry: insert, material: 'insert' },
    { geometry: cup, material: 'polished' },
    { geometry: pip, material: 'lume' },
  ];
}

// The insert ring is turned to face the front (rotateX(π)), which already flips it vertically; no pre-mirror.
export function paintInsert() {
  return canvasTexture(2048, 2048, (g) => {
    const s = 2048, R = s / 2;
    const inner = (T.insertInner / T.insertOuter) * R;
    g.fillStyle = T.insertBlue;
    g.fillRect(0, 0, s, s);
    g.translate(R, R);
    g.fillStyle = '#e9e7e1';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const band = R - inner;
    for (const mark of bezelMarks()) {
      g.save();
      g.rotate((mark.minute / 60) * Math.PI * 2);
      const outer = -R * 0.985;
      // Sizes from bobs-126699.jpg: ticks 0.37 mm wide in the middle of the band, bars 0.86 mm wide across nearly all of it.
      if (mark.kind === 'triangle') {
        g.beginPath();
        g.moveTo(0, -inner - band * 0.3);
        g.lineTo(band * 0.48, outer);
        g.lineTo(-band * 0.48, outer);
        g.fill();
      } else if (mark.kind === 'tick') g.fillRect(-R * 0.0093, outer + band * 0.27, R * 0.0186, band * 0.38);
      else if (mark.kind === 'bar') g.fillRect(-R * 0.0215, outer + band * 0.05, R * 0.043, band * 0.87);
      else {
        // Tall, narrow digits about 0.7 of the band high (2.7 mm on bobs-126699.jpg).
        g.font = `300 ${band * 1.1}px Inter, sans-serif`;
        g.translate(0, -(inner + band * 0.5));
        g.scale(0.85, 1);
        g.fillText(mark.text!, 0, 0);
      }
      g.restore();
    }
  }, 8);
}
