import type { Caliber } from '../model/schema';
import { toothCount } from '../model/validate';

export function caliberVars(c: Caliber) {
  return {
    specs: { ...c.specs, hz: c.specs.vph / 7200, beatsPerSecond: c.specs.vph / 3600 },
    parts: Object.fromEntries(c.parts.map((p) => [p.id, { teeth: toothCount(p.shape) }])),
  };
}
