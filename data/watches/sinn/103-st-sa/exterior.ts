import type { ExteriorBuilder } from '../../../../src/scene/exterior/contract';
import { sinnBezel, sinnCrystal } from './bezel';
import { caseBack, sinnCase, sinnCaseback } from './case';
import { crownX, sinnCrown, sinnPushers } from './crown';
import { sinnDial } from './dial';
import { sinnHands } from './hands';
import { sinnMaterials } from './materials';
import { P } from './params';
import { sinnStrap } from './strap';

// Sinn 103 St Sa, built from reference photos (see shots.ts); dimensions and their sources in params.ts.
const sinn103: ExteriorBuilder = {
  geometry: ({ movement: m, quality }) => ({
    parts: {
      case: sinnCase(m, quality === 'high' ? 0.2 : 0.3),
      bezel: sinnBezel(m),
      dial: sinnDial(m),
      crystal: sinnCrystal(m),
      strap: sinnStrap(m),
      caseback: sinnCaseback(m),
      crown: sinnCrown(),
      hands: sinnHands(),
      pushers: sinnPushers(),
    },
    anchors: { seatRadius: P.bore, crownX: crownX(), caseBackZ: caseBack(m), casebackTurns: true },
  }),
  materials: sinnMaterials,
};

export default sinn103;
