import type { ExteriorBuilder } from '../../../../src/scene/exterior/contract';
import { caseStep } from '../../../../src/scene/exterior/kit/surfaceNets';
import { presageBezel } from './bezel';
import { caseBack, presageCase, presageCaseback } from './case';
import { crownX, presageCrown } from './crown';
import { presageCrystal } from './crystal';
import { presageDial } from './dial';
import { presageHands } from './hands';
import { presageMaterials } from './materials';
import { P } from './params';
import { presageStrap } from './strap';

// Seiko Presage Cocktail Time SRPB43, built from reference photos (see shots.ts); dimensions and sources in params.ts.
const srpb43: ExteriorBuilder = {
  geometry: ({ movement: m, quality }) => ({
    parts: {
      case: presageCase(m, caseStep(quality)),
      bezel: presageBezel(m),
      dial: presageDial(m),
      crystal: presageCrystal(m),
      strap: presageStrap(m),
      caseback: presageCaseback(m),
      crown: presageCrown(),
      hands: presageHands(P.dialRadius),
    },
    anchors: { seatRadius: P.bore, crownX: crownX(), caseBackZ: caseBack(m), casebackTurns: true },
  }),
  materials: presageMaterials,
};

export default srpb43;
