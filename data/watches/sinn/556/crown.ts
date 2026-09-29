import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { flutedCrown } from '../../../../src/scene/exterior/kit/crown';
import { S } from './params';

// The crown's inner end sits on the notch floor between the guards (the drum), just clear of it.
const NOTCH_CLEARANCE = 0.3;

// Distance of the crown's centre from the watch centre along the stem.
export const crownRadius = () => S.caseRadius + NOTCH_CLEARANCE + S.crownLength / 2;

// A long screw-down crown: coin-edge flutes along the whole side and a rounded end (its engraved S is left off).
export function sinnCrown(): ExteriorLayer[] {
  return flutedCrown({
    diameter: S.crownDiameter, length: S.crownLength, fluteDepth: 0.16,
    tube: { diameter: S.tubeDiameter, length: S.tubeLength + NOTCH_CLEARANCE },
    end: { inset: 1.2, run: 0.9, dome: S.crownDome }, grip: { fromEnd: 0.95, fromNeck: 0.25, neckStep: 0.35 },
    material: 'bezel',
  });
}
