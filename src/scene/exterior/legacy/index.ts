import type { ExteriorBuilder } from '../contract';
import { caseback } from '../kit/caseback';
import { bezel } from './bezel';
import { caseBody } from './caseBody';
import { LegacyConfigSchema, validateLegacy, type LegacyConfig } from './config';
import { crown, crownX } from './crown';
import { crystal } from './crystal';
import { dialLayers, dialRadius } from './dial';
import { watchHands } from './hands';
import { legacyMaterials } from './materials';
import { caseRadii } from './radii';
import { strap } from './strap';

export function legacyRound(config: LegacyConfig): ExteriorBuilder {
  const e = LegacyConfigSchema.parse(config);
  return ({ movement: m, quality }) => {
    const errors = validateLegacy(e, m.diameterMm);
    if (errors.length > 0) throw new Error(errors.join('\n'));
    const r = caseRadii(m, e);
    const hands = watchHands(e, dialRadius(r));
    return {
      parts: {
        case: caseBody(e, r, quality === 'high' ? 0.2 : 0.3),
        bezel: bezel(e, r),
        dial: dialLayers(e, r, m),
        crystal: crystal(e, r),
        strap: strap(e, r),
        caseback: caseback(r.outer, e.caseback === 'display', r.bottom + r.height + 0.6),
        crown: crown(e, r),
        hands: { hour: hands.hour, minute: hands.minute, seconds: e.hands.seconds ? hands.seconds : [] },
      },
      materials: legacyMaterials(e),
      anchors: { seatRadius: r.inner, crownX: crownX(e, r), caseBackZ: r.bottom + r.height },
    };
  };
}
