import type { ExteriorBuilder } from '../../../../src/scene/exterior/contract';
import { tudorBezel } from './bezel';
import { tudorBracelet } from './bracelet';
import { tudorCase, tudorCaseback } from './case';
import { crownX, tudorCrown } from './crown';
import { tudorCrystal } from './crystal';
import { tudorDial } from './dial';
import { tudorHands } from './hands';
import { tudorMaterials } from './materials';
import { T } from './params';

// Tudor Heritage Black Bay 79220B, built from reference photos (see shots.ts); dimensions and their sources in params.ts.
const tudor79220b: ExteriorBuilder = ({ movement: m, quality }) => ({
  parts: {
    case: tudorCase(m, quality === 'high' ? 0.2 : 0.3),
    bezel: tudorBezel(m),
    dial: tudorDial(m),
    crystal: tudorCrystal(m),
    strap: tudorBracelet(m),
    caseback: tudorCaseback(m),
    crown: tudorCrown(),
    hands: tudorHands(T.dialRadius),
  },
  materials: tudorMaterials(),
  anchors: { seatRadius: T.bore, crownX: crownX() },
});

export default tudor79220b;
