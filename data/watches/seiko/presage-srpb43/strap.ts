import type { ExteriorLayer, MovementFrame } from '../../../../src/scene/exterior/contract';
import { leatherStrap, strapPath as path, type StrapMount } from '../../../../src/scene/exterior/kit/strap';
import { caseShape } from './case';
import { P } from './params';

const mount = (m: MovementFrame): StrapMount => ({ lug: caseShape(m), lugX: P.lugGap / 2 + P.lugWidth / 2, caseRadius: P.caseRadius, strap: P.strap });

export const strapPath = (m: MovementFrame) => path(mount(m));

export const presageStrap = (m: MovementFrame): ExteriorLayer[] => leatherStrap(mount(m));
