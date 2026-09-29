import type { HandLayer } from '../../../../src/scene/exterior/contract';
import { handFrame, handHub, handPlate, mirror, type P } from '../../../../src/scene/exterior/kit/hands';
import { H } from './params';

// A lance: a slim shaft from the pivot, widening to `width` where the lume ends, a short point, then a steel needle
// on to the tip. Returns the outer outline and the lume window inset by the frame.
function lance(len: number, lume: readonly [number, number], width: number, shaft: number) {
  const w = width / 2, point = w * 1.6, n = H.needle / 2, f = H.handFrame;
  const outline = mirror([[shaft, 1.0], [shaft, -lume[0]], [w, -lume[1]], [n, -(lume[1] + point)], [n, -(len - n * 3)], [0, -len]]);
  // The window follows the lance's taper, inset by the frame on every side.
  const t = (y: number) => shaft + ((w - shaft) * (y - lume[0])) / (lume[1] - lume[0]);
  const from = lume[0] + f, to = lume[1] - f * 0.3;
  const window = mirror([[t(from) - f, -from], [t(to) - f, -to], [0, -(lume[1] + point - f * 2.2)]]);
  return { outline, window };
}

// The Khaki Field's lance hands: a polished frame filled with lume for hour and minute, each ending in a steel
// needle; a thin seconds hand with a lume arrow at its tip. Hands point to −Y and pivot at the origin.
export function hamiltonHands() {
  const T = H.handThickness;
  const hr = lance(H.hour, H.hourLume, H.hourWidth, H.hourShaft);
  const hour: HandLayer[] = [
    { geometry: handFrame(hr.outline, hr.window, 0, T, 4), material: 'steel' },
    { geometry: handPlate(hr.window, T - 0.03, -0.01), material: 'lume' },
    { geometry: handHub(H.hubs.hour, -0.09, 0.18), material: 'steel' },
  ];
  const mn = lance(H.minute, H.minuteLume, H.minuteWidth, H.minuteShaft);
  const minute: HandLayer[] = [
    { geometry: handFrame(mn.outline, mn.window, 0, T, 4), material: 'steel' },
    { geometry: handPlate(mn.window, T - 0.03, -0.01), material: 'lume' },
    { geometry: handHub(H.hubs.minute, -0.09, 0.18), material: 'steel' },
  ];
  const sw = H.secondsShaft / 2, [al, aw] = H.arrow, sL = H.seconds;
  const arrow: P[] = [[0, -sL], [aw / 2, -(sL - al)], [-aw / 2, -(sL - al)]];
  // The arrow's steel rim, a little narrower than the lance frames on this thin hand.
  const inset = 0.12;
  const arrowLume: P[] = [[0, -(sL - inset * 2.5)], [aw / 2 - inset, -(sL - al + inset * 0.7)], [-(aw / 2 - inset), -(sL - al + inset * 0.7)]];
  const seconds: HandLayer[] = [
    { geometry: handPlate(mirror([[sw * 1.4, H.secondsTail], [sw, 0], [sw, -(sL - al + 0.05)], [0, -(sL - al + 0.05)]]), 0.08, 0), material: 'steel' },
    { geometry: handPlate(arrow, 0.08, 0), material: 'steel' },
    { geometry: handPlate(arrowLume, 0.06, -0.06), material: 'lume' },
    { geometry: handHub(H.hubs.seconds, -0.1, 0.18), material: 'steel' },
  ];
  return { hour, minute, seconds };
}
