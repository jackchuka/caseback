import type { ExteriorBuilder } from '../../../../src/scene/exterior/contract';
import { caseStep } from '../../../../src/scene/exterior/kit/surfaceNets';
import { caseBack, belCantoCase } from './case';
import { belCantoCaseback } from './caseback';
import { crownRadius, belCantoCrown, belCantoPushers } from './crown';
import { belCantoCrystal } from './crystal';
import { belCantoDial } from './dial';
import { belCantoHands } from './hands';
import { belCantoMaterials } from './materials';
import { P } from './params';
import { belCantoStrap } from './strap';

// Christopher Ward C1 Bel Canto (Azzurro Blue LE), built from reference photos (see shots.ts); dimensions and their
// sources in params.ts. The case's layers carry its polished bezel ring. The dial is the FS01's module plate, with the
// chapter ring floating over it at 12; the hands turn on the sub-dial's arbor.
const belCanto: ExteriorBuilder = {
  geometry: ({ movement: m, quality }) => ({
    parts: {
      case: belCantoCase(m, caseStep(quality)),
      bezel: [],
      dial: belCantoDial(m),
      crystal: belCantoCrystal(m),
      strap: belCantoStrap(m),
      caseback: belCantoCaseback(m),
      crown: belCantoCrown(),
      hands: belCantoHands(),
      pushers: belCantoPushers(),
    },
    anchors: { seatRadius: P.bore, crownRadius: crownRadius(), caseBackZ: caseBack(m), casebackTurns: false },
  }),
  materials: belCantoMaterials,
};

export default belCanto;
