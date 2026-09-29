import type { ExteriorBuilder } from '../../../../src/scene/exterior/contract';
import { caseStep } from '../../../../src/scene/exterior/kit/surfaceNets';
import { sinnBezel, sinnCrystal } from './bezel';
import { caseBack, sinnCase, sinnCaseback } from './case';
import { crownRadius, sinnCrown, sinnPushers } from './crown';
import { sinnDial } from './dial';
import { sinnHands } from './hands';
import { sinnMaterials } from './materials';
import { P } from './params';
import { sinnStrap } from './strap';

// Sinn 103 St Sa, built from reference photos (see shots.ts); dimensions and their sources in params.ts.
const sinn103: ExteriorBuilder = {
  geometry: ({ movement: m, quality }) => ({
    parts: {
      case: sinnCase(m, caseStep(quality)),
      bezel: sinnBezel(m),
      dial: sinnDial(m),
      crystal: sinnCrystal(m),
      strap: sinnStrap(m),
      caseback: sinnCaseback(m),
      crown: sinnCrown(),
      hands: sinnHands(),
      pushers: sinnPushers(),
    },
    anchors: { seatRadius: P.bore, crownRadius: crownRadius(), caseBackZ: caseBack(m), casebackTurns: true },
  }),
  materials: sinnMaterials,
};

export default sinn103;
