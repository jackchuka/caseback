import type { ExteriorBuilder } from '../../../../src/scene/exterior/contract';
import { caseback } from '../../../../src/scene/exterior/kit/caseback';
import { tudorBezel } from './bezel';
import { tudorBracelet } from './bracelet';
import { caseShape, tudorCase } from './case';
import { crownX, tudorCrown } from './crown';
import { tudorCrystal } from './crystal';
import { tudorDial } from './dial';
import { tudorHands } from './hands';
import { tudorMaterials } from './materials';
import { T } from './params';

// The kit caseback is 1 mm thick; its inner face sits flush on the case middle's back.
const CASEBACK = 1;

// Tudor Heritage Black Bay 79220B, built from reference photos (see shots.ts); dimensions and their sources in params.ts.
const tudor79220b: ExteriorBuilder = ({ movement: m, quality }) => ({
  parts: {
    case: tudorCase(m, quality === 'high' ? 0.2 : 0.3),
    bezel: tudorBezel(m),
    dial: tudorDial(m),
    crystal: tudorCrystal(m),
    strap: tudorBracelet(m),
    caseback: caseback(T.caseRadius, false, caseShape(m).back + CASEBACK / 2),
    crown: tudorCrown(),
    hands: tudorHands(T.dialRadius),
  },
  materials: tudorMaterials(),
  anchors: { seatRadius: T.bore, crownX: crownX() },
});

export default tudor79220b;
