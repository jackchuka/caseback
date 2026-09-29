import type { HandLayer } from '../../../../src/scene/exterior/contract';
import { handHub, handPlate, mirror } from '../../../../src/scene/exterior/kit/hands';
import { V } from './params';

// A faceted sword: widest a third of the way out, tapering to a point, with a short tail; the bevel runs to a ridge
// down its length, which is what catches the light on the photos.
function sword(len: number, width: number, tail: number) {
  const w = width / 2;
  const outline = mirror([[w * 0.45, tail], [w * 0.7, 0], [w, -len * 0.3], [w * 0.55, -len * 0.85], [0, -len]]);
  return handPlate(outline, V.handThickness, 0, w * 0.8);
}

// The Ventura's silver sword hands, and a slim seconds hand whose last stretch is red (the ruby material: hands may
// only use the movement's own materials).
export function venturaHands() {
  const hour: HandLayer[] = [
    { geometry: sword(V.hour, V.hourWidth, V.hourTail), material: 'steel' },
    { geometry: handHub(V.hubs.hour, -0.1), material: 'steel' },
  ];
  const minute: HandLayer[] = [
    { geometry: sword(V.minute, V.minuteWidth, V.minuteTail), material: 'steel' },
    { geometry: handHub(V.hubs.minute, -0.1), material: 'steel' },
  ];
  const s = V.secondsShaft / 2, red = V.seconds - V.secondsRed;
  const seconds: HandLayer[] = [
    { geometry: handPlate(mirror([[s * 1.6, V.secondsTail], [s, 0], [s, -red], [0, -red]]), 0.08, 0), material: 'steel' },
    { geometry: handPlate(mirror([[s, -red], [s * 0.8, -(V.seconds - 0.2)], [0, -V.seconds]]), 0.08, 0), material: 'ruby' },
    { geometry: handHub(V.hubs.seconds, -0.1), material: 'steel' },
  ];
  return { hour, minute, seconds };
}
