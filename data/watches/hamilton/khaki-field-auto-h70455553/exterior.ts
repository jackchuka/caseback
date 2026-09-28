import type { ExteriorBuilder } from '../../../../src/scene/exterior/contract';
import { hamiltonBezel } from './bezel';
import { caseBack, hamiltonCase } from './case';
import { hamiltonCaseback } from './caseback';
import { crownX, hamiltonCrown } from './crown';
import { hamiltonCrystal } from './crystal';
import { hamiltonDial } from './dial';
import { hamiltonHands } from './hands';
import { hamiltonMaterials } from './materials';
import { H } from './params';
import { hamiltonStrap } from './strap';

// Hamilton Khaki Field Auto H70455553, built from reference photos (see shots.ts); dimensions and their sources in
// params.ts.
const khakiField: ExteriorBuilder = {
  geometry: ({ movement: m, quality }) => ({
    parts: {
      case: hamiltonCase(m, quality === 'high' ? 0.2 : 0.3),
      bezel: hamiltonBezel(m),
      dial: hamiltonDial(m),
      crystal: hamiltonCrystal(m),
      strap: hamiltonStrap(m),
      caseback: hamiltonCaseback(m),
      crown: hamiltonCrown(),
      hands: hamiltonHands(),
    },
    anchors: { seatRadius: H.bore, crownX: crownX(), caseBackZ: caseBack(m), casebackTurns: true },
  }),
  materials: hamiltonMaterials,
};

export default khakiField;
