import { z } from 'zod';
import { SourceSchema } from './schema';
import { LegacyConfigSchema, validateLegacy } from '../scene/exterior/legacy/config';

export const WatchSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/),
  brand: z.string(),
  model: z.string(),
  reference: z.string(),
  year: z.number().int().optional(),
  caliberId: z.string(),
  caliberNotes: z.string().optional(),
  movement: z.object({ name: z.string(), vph: z.number().int().positive(), powerReserveH: z.number().positive(), sourceIds: z.array(z.string()).min(1) }).optional(),
  exterior: LegacyConfigSchema,
  sources: z.array(SourceSchema).min(1),
});

export type Watch = z.infer<typeof WatchSchema>;

export function validateWatch(w: Watch, calibers: Record<string, { specs: { diameterMm: number } }>): string[] {
  const c = calibers[w.caliberId];
  if (!c) return [`${w.id}: unknown caliber ${w.caliberId}`];
  return validateLegacy(w.exterior, c.specs.diameterMm).map((e) => `${w.id}: ${e}`);
}
