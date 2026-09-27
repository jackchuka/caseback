import type { Caliber } from '../model/schema';
import type { Watch } from '../model/watch';

export function searchCatalog(q: string, calibers: Caliber[], watches: Watch[]) {
  const needle = q.trim().toLowerCase();
  const hit = (...fields: string[]) => needle === '' || fields.some((f) => f.toLowerCase().includes(needle));
  const nameOf = (id: string) => calibers.find((c) => c.id === id)?.name ?? id;
  return {
    calibers: calibers.filter((c) => hit(c.id, c.name)),
    watches: watches.filter((w) => hit(w.brand, w.model, w.reference, w.caliberId, nameOf(w.caliberId), w.caliberNotes ?? '')),
  };
}
