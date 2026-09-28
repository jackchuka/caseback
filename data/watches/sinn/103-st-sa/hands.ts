import type { HandLayer } from '../../../../src/scene/exterior/contract';
import { handHub, handPlate, mirror, type P } from '../../../../src/scene/exterior/kit/hands';
import { P as S } from './params';

const H = S.hands;

// Sinn's pilot hands: a narrow neck out of the hub, a broad lume blade with an angled end, and a thin white tip that
// runs on to the numerals (hour) or the minute track (minute). Pivot at the origin, pointing to −Y.
function bladeHand(h: { blade: readonly number[]; tip: number; width: number }): HandLayer[] {
  const [from, to] = h.blade as [number, number];
  const w = h.width / 2, neck = 0.24, needle = 0.12;
  const outline: P[] = mirror([[neck, 1.0], [neck, -(from - 0.4)], [w, -from], [w, -(to - w)], [needle, -to], [needle, -(h.tip - 0.3)], [0, -h.tip]]);
  return [
    { geometry: handPlate(outline, H.thickness, 0, 0.02), material: 'lume' },
    { geometry: handHub(H.hub, -0.12), material: 'steel' },
  ];
}

// The chronograph seconds: a thin white needle with an arrowhead short of its tip and a long counterweighted tail.
function chronoHand(): HandLayer[] {
  const C = H.chrono;
  const w = C.width / 2;
  const arrowAt = C.length - 1.6;
  const outline: P[] = mirror([[w * 1.8, C.tail], [w, 0.6], [w, -(arrowAt - C.arrow)], [0.45, -arrowAt], [w * 0.8, -arrowAt + 0.15], [w * 0.8, -(C.length - 0.2)], [0, -C.length]]);
  return [
    { geometry: handPlate(outline, 0.1, 0, 0.02), material: 'lume' },
    { geometry: handHub(0.65, -0.1), material: 'steel' },
  ];
}

// The three sub-dial hands: thin white sticks with a short tail and a small white hub.
function subHand(): HandLayer[] {
  const U = H.sub;
  const w = U.width / 2;
  return [
    { geometry: handPlate(mirror([[w, U.tail], [w, -(U.length - 0.3)], [0, -U.length]]), 0.08, 0, 0.01), material: 'lume' },
    { geometry: handHub(0.4, -0.06, 0.12), material: 'lume' },
  ];
}

// Movement materials only: the white paint and lume read as the movement's lume, the hub as its steel.
export function sinnHands() {
  return {
    hour: bladeHand(H.hour),
    minute: bladeHand(H.minute),
    seconds: [] as HandLayer[],
    extra: {
      'chrono-seconds-hand': chronoHand(),
      'seconds-hand': subHand(),
      'minute-counter-hand': subHand(),
      'hour-counter-hand': subHand(),
    },
  };
}
