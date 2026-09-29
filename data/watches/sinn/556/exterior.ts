import type { ExteriorBuilder } from '../../../../src/scene/exterior/contract';
import { caseStep } from '../../../../src/scene/exterior/kit/surfaceNets';
import { sinnBezel, sinnCrystal } from './bezel';
import { sinnBracelet } from './bracelet';
import { caseBack, sinnCase, sinnCaseback } from './case';
import { crownRadius, sinnCrown } from './crown';
import { sinnDial } from './dial';
import { sinnHands } from './hands';
import { sinnMaterials } from './materials';
import { S } from './params';

// Sinn 556 I, built from reference photos (see shots.ts); dimensions and their sources in params.ts.
const sinn556: ExteriorBuilder = {
  geometry: ({ movement: m, quality }) => ({
    parts: {
      case: sinnCase(m, caseStep(quality)),
      bezel: sinnBezel(m),
      dial: sinnDial(m),
      crystal: sinnCrystal(m),
      strap: sinnBracelet(m),
      caseback: sinnCaseback(m),
      crown: sinnCrown(),
      hands: sinnHands(),
    },
    anchors: { seatRadius: S.bore, crownRadius: crownRadius(), caseBackZ: caseBack(m), casebackTurns: true },
  }),
  materials: sinnMaterials,
};

export default sinn556;
