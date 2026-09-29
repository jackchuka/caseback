import type { ExteriorBuilder } from '../../../../src/scene/exterior/contract';
import { caseStep } from '../../../../src/scene/exterior/kit/surfaceNets';
import { tudorBezel } from './bezel';
import { tudorBracelet } from './bracelet';
import { caseShape, tudorCase, tudorCaseback } from './case';
import { crownRadius, tudorCrown } from './crown';
import { tudorCrystal } from './crystal';
import { tudorDial } from './dial';
import { tudorHands } from './hands';
import { tudorMaterials } from './materials';
import { T } from './params';

// Tudor Heritage Black Bay 79220B, built from reference photos (see shots.ts); dimensions and their sources in params.ts.
const tudor79220b: ExteriorBuilder = {
  geometry: ({ movement: m, quality }) => ({
    parts: {
      case: tudorCase(m, caseStep(quality)),
      bezel: tudorBezel(m),
      dial: tudorDial(m),
      crystal: tudorCrystal(m),
      strap: tudorBracelet(m),
      caseback: tudorCaseback(m),
      crown: tudorCrown(),
      hands: tudorHands(T.dialRadius),
    },
    anchors: { seatRadius: T.bore, crownRadius: crownRadius(), caseBackZ: caseShape(m).back, casebackTurns: true },
  }),
  materials: tudorMaterials,
};

export default tudor79220b;
