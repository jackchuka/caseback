import { calibers } from '../../../calibers';
import type { ExteriorBuilder } from '../../../../src/scene/exterior/contract';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { sinnBezel, sinnCrystal } from './bezel';
import { sinnBracelet } from './bracelet';
import { caseBack, sinnCase, sinnCaseback } from './case';
import { crownX, sinnCrown } from './crown';
import { sinnDial } from './dial';
import { sinnHands } from './hands';
import { sinnMaterials } from './materials';
import { S } from './params';
import watch from './watch';

// Sinn 556 I, built from reference photos (see shots.ts); dimensions and their sources in params.ts.
const sinn556: ExteriorBuilder = {
  geometry: ({ movement: m, quality }) => ({
    parts: {
      case: sinnCase(m, quality === 'high' ? 0.2 : 0.3),
      bezel: sinnBezel(m),
      dial: sinnDial(m),
      crystal: sinnCrystal(m),
      strap: sinnBracelet(m),
      caseback: sinnCaseback(m),
      crown: sinnCrown(),
      hands: sinnHands(),
    },
    anchors: { seatRadius: S.bore, crownX: crownX(), caseBackZ: caseBack(m) },
  }),
  // The dial's printed date-window frame follows the movement's window, which the materials get no context for.
  materials: () => sinnMaterials(movementFrame(calibers[watch.caliberId]!)),
};

export default sinn556;
