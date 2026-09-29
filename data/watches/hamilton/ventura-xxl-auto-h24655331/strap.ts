import type { ExteriorLayer } from '../../../../src/scene/exterior/contract';
import { boxStrap } from '../../../../src/scene/exterior/kit/bend';
import { caseBack } from './case';
import { V } from './params';

const S = V.strap;

// The strap's centre height where it leaves the case: tucked under the wings, against the back.
export const strapZ = () => caseBack() - S.thickness / 2 + 0.2;

// The black rubber strap: no lugs or spring bars show, each half runs out from under the case's back, a little
// toward 9 o'clock as on the photo, and curves round the wrist.
export function venturaStrap(): ExteriorLayer[] {
  return boxStrap(S, { y: S.start, z: strapZ() }, [6, 70]).map((g) => ({ geometry: g.translate(S.offsetX, 0, 0), material: 'strap', name: 'strap' }));
}
