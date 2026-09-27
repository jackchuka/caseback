import type { Caliber } from '../model/schema';
import type { Watch } from '../model/watch';

// A watch may carry a derivative of the caliber (e.g. Hamilton H-10 on an ETA 2824 base); the intro states its own numbers.
export function introFacts(caliber: Caliber, watch?: Watch) {
  const m = watch?.movement;
  return {
    name: m?.name ?? caliber.name,
    beats: (m?.vph ?? caliber.specs.vph) / 3600,
    diameter: caliber.specs.diameterMm,
    base: m ? caliber.name : null,
  };
}
