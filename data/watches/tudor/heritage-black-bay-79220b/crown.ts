import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { flutedCrown } from '../../../../src/scene/exterior/kit/crown';
import { T } from './params';

// Distance of the crown's centre from the watch centre along the stem: past the case wall and the exposed tube.
export const crownRadius = () => T.caseRadius + T.tubeLength + T.crownLength / 2 - 0.1;

// The big crown: a flat end face (its engraved rose is left off), a deep fluted grip, and a short tube into the case.
export function tudorCrown(): ExteriorLayer[] {
  return flutedCrown({ diameter: T.crownDiameter, length: T.crownLength, fluteDepth: 0.2, tube: { diameter: T.tubeDiameter, length: T.tubeLength } });
}
