import type { HandLayer } from '../../../../src/scene/exterior/contract';
import { handFrame, handHub, handPlate, mirror } from '../../../../src/scene/exterior/kit/hands';
import { P } from './params';

// A skeleton baton: a slim shaft from a short tail through the pivot, widening to `width` where the lume starts, and
// running straight to a short point. Returns the outline and the lume window inset by the frame.
function baton(len: number, width: number) {
  const H = P.hands, w = width / 2, s = H.shaft / 2, f = H.frame, point = w * 0.9;
  const outline = mirror([[s, H.tail], [s, -(H.lumeFrom - 0.3)], [w, -H.lumeFrom], [w, -(len - point)], [0, -len]]);
  const window = mirror([[w - f, -(H.lumeFrom + f)], [w - f, -(len - point - f * 0.4)], [0, -(len - f * 2.6)]]);
  return { outline, window };
}

// The Bel Canto's skeletonised hands, hour and minute only (there is no seconds): a polished steel frame filled with
// lume, and a domed hub. Hands point to −Y and pivot at the origin.
export function belCantoHands() {
  const H = P.hands, T = H.thickness;
  const hand = (len: number, width: number, hub: number): HandLayer[] => {
    const b = baton(len, width);
    return [
      { geometry: handFrame(b.outline, b.window, 0, T, 4), material: 'steel' },
      { geometry: handPlate(b.window, T - 0.03, -0.01), material: 'lume' },
      { geometry: handHub(hub, -0.09, 0.18), material: 'steel' },
    ];
  };
  return { hour: hand(H.hour, H.hourWidth, H.hub), minute: hand(H.minute, H.minuteWidth, H.hub * 0.75), seconds: [] as HandLayer[] };
}
