import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { leatherStrap } from '../../../../src/scene/exterior/kit/strap';
import { caseShape } from './case';
import { P } from './params';

export const sinnStrap = (m: MovementFrame): ExteriorLayer[] => leatherStrap({ lug: caseShape(m), lugX: P.lugGap / 2 + 1.5, caseRadius: P.caseRadius, strap: P.strap });
