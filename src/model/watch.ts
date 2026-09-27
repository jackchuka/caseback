import { z } from 'zod';
import { SourceSchema } from './schema';

const pos = z.number().positive();

export const WatchExteriorSchema = z.object({
  case: z.object({ diameterMm: pos, thicknessMm: pos, lugWidthMm: pos, material: z.enum(['steel', 'gold', 'titanium']) }),
  bezel: z.object({ kind: z.enum(['plain', 'dive']), color: z.string().optional() }),
  crown: z.object({ diameterMm: pos, lengthMm: pos }),
  caseback: z.enum(['solid', 'display']),
});

export const WatchSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/),
  brand: z.string(),
  model: z.string(),
  reference: z.string(),
  year: z.number().int().optional(),
  caliberId: z.string(),
  caliberNotes: z.string().optional(),
  exterior: WatchExteriorSchema,
  sources: z.array(SourceSchema).min(1),
});

export type WatchExterior = z.infer<typeof WatchExteriorSchema>;
export type Watch = z.infer<typeof WatchSchema>;

export function validateWatch(w: Watch, calibers: Record<string, { specs: { diameterMm: number } }>): string[] {
  const c = calibers[w.caliberId];
  if (!c) return [`${w.id}: unknown caliber ${w.caliberId}`];
  // The case needs a casing ring and a wall around the movement.
  if (w.exterior.case.diameterMm < c.specs.diameterMm + 4) return [`${w.id}: case ${w.exterior.case.diameterMm} mm cannot hold a ${c.specs.diameterMm} mm movement`];
  return [];
}
