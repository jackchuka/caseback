import type { HandLayer } from '../../../../src/scene/exterior/contract';
import { diamondAt, handFrame as frame, handHub as hub, handPlate as plate, mirror, type P } from '../../../../src/scene/exterior/kit/hands';
import { T } from './params';

const H = T.hands;

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
