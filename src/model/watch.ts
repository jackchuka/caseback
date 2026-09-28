import { z } from 'zod';
import type { ExteriorBuilder } from '../scene/exterior/contract';
import { SourceSchema } from './schema';

export const WatchSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/),
  brand: z.string(),
  model: z.string(),
  reference: z.string(),
  year: z.number().int().optional(),
  caliberId: z.string(),
  caliberNotes: z.string().optional(),
  // `number`: the calibre number as a caseback would engrave it, without the maker's name.
  movement: z
    .object({ name: z.string(), number: z.string(), jewels: z.number().int().positive().optional(), vph: z.number().int().positive(), powerReserveH: z.number().positive(), sourceIds: z.array(z.string()).min(1) })
    .optional(),
  sources: z.array(SourceSchema).min(1),
});

export type WatchMeta = z.infer<typeof WatchSchema>;
export type Watch = WatchMeta & { exterior: ExteriorBuilder };

export function validateWatch(w: WatchMeta, calibers: Record<string, unknown>): string[] {
  return calibers[w.caliberId] ? [] : [`${w.id}: unknown caliber ${w.caliberId}`];
}
