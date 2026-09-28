import type { HandLayer } from '../../../../src/scene/exterior/contract';
import { handHub, handPlate, mirror, type P } from '../../../../src/scene/exterior/kit/hands';
import { S } from './params';

const H = S.hands;
const LUME = 0.08;

// A black sword: a narrow rod out of the hub that widens into a long blade with a pointed tip. The lume fills the
// blade from its square back end to just short of the point. Pivot at the origin, pointing to −Y.
function sword(len: number, base: number, width: number, point: number): HandLayer[] {
  const hw = width / 2, rod = H.stem / 2;
  const outline = mirror([[rod, 0.8], [rod, -(base - 0.6)], [hw * 0.82, -base], [hw, -(len - point)], [0, -len]]);
  const inset = 0.1;
  const lume = mirror([[hw * 0.82 - inset, -(base + inset)], [hw - inset, -(len - point)], [0, -(len - inset * 2.5)]]);
  return [
    { geometry: handPlate(outline, H.thickness, 0, 0.02), material: 'slot' },
    { geometry: handPlate(lume, LUME, -H.thickness + 0.02), material: 'lume' },
  ];
}

// The 556's hands: black swords filled with lume, and a thin white seconds hand on a black tail. Movement materials
// only: 'slot' is the movement's black, and the seconds hand's white paint reads as its lume.
export function sinnHands() {
  const hour = [...sword(H.hour, H.hourBase, H.hourWidth, H.hourPoint), { geometry: handHub(H.hub, -0.1), material: 'slot' as const }];
  const minute = [...sword(H.minute, H.minuteBase, H.minuteWidth, H.minutePoint), { geometry: handHub(H.hub * 0.85, -0.1), material: 'slot' as const }];
  const sw = H.secondsWidth / 2;
  const tail: P[] = mirror([[H.tailWidth / 2, H.tail], [sw * 1.4, -H.secondsWhiteFrom]]);
  const white: P[] = mirror([[sw * 1.3, -H.secondsWhiteFrom], [sw, -(H.seconds - 0.2)], [0, -H.seconds]]);
  const seconds: HandLayer[] = [
    { geometry: handPlate(tail, 0.1, 0, 0.02), material: 'slot' },
    { geometry: handPlate(white, 0.1, 0, 0.02), material: 'lume' },
    { geometry: handHub(0.6, -0.1), material: 'slot' },
  ];
  return { hour, minute, seconds };
}
