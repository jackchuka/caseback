import type { Caliber } from '../model/schema';
import { toothCount } from '../model/validate';
import { hoursPerBarrelTurn } from '../kinematics/winding';

export function caliberVars(c: Caliber) {
  return {
    specs: { ...c.specs, hz: c.specs.vph / 7200, beatsPerSecond: c.specs.vph / 3600 },
    hoursPerTurn: hoursPerBarrelTurn(c),
    parts: Object.fromEntries(c.parts.map((p) => [p.id, { teeth: toothCount(p.shape) }])),
  };
}
