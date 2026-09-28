import type { Caliber } from '../../model/schema';
import type { Watch } from '../../model/watch';

// What a caseback engraves: the watch's own movement when it names one (a maker's version of the base caliber),
// else the caliber's number (its name without the maker, which is its first word), and the matching jewel count.
export function casebackEngraving(caliber: Caliber, watch?: Watch) {
  const m = watch?.movement;
  return { number: m?.number ?? caliber.name.split(' ').at(-1)!, jewels: m?.jewels ?? caliber.specs.jewels };
}
