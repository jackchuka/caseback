import type { Mode } from '../../state/store';
import type { Side } from '../focus';
export function exteriorVisibility(mode: Mode, stepSide: Side | null, explode: number) {
  const intro = mode === 'intro' || mode === 'opening';
  const hideDial = (mode === 'tour' && stepSide === 'dial') || (mode === 'free' && explode > 0.01);
  return { dial: !hideDial, crystal: !hideDial, strap: intro };
}
