import type { ExteriorBuilder } from '../../../../src/scene/exterior/contract';
import { caseBack, venturaCase } from './case';
import { venturaCaseback } from './caseback';
import { crownX, venturaCrown } from './crown';
import { venturaCrystal } from './crystal';
import { venturaDial } from './dial';
import { venturaHands } from './hands';
import { venturaMaterials } from './materials';
import { V } from './params';
import { venturaStrap } from './strap';

// Hamilton Ventura XXL Auto H24655331, built from reference photos (see shots.ts); dimensions and their sources in
// params.ts. The first non-round case: its plan is traced from the front photo.
const ventura: ExteriorBuilder = {
  geometry: ({ movement: m, quality }) => ({
    parts: {
      case: venturaCase(m, quality === 'high' ? 0.2 : 0.3),
      bezel: [],
      dial: venturaDial(m),
      crystal: venturaCrystal(),
      strap: venturaStrap(),
      caseback: venturaCaseback(),
      crown: venturaCrown(),
      hands: venturaHands(),
    },
    anchors: { seatRadius: V.seat, crownX: crownX(), caseBackZ: caseBack(), casebackTurns: false },
  }),
  materials: venturaMaterials,
};

export default ventura;
