import { z } from 'zod';
import { SourceSchema } from './schema';

const pos = z.number().positive();
const Finish = z.enum(['brushed', 'polished']);

export const WatchExteriorSchema = z.object({
  case: z.object({
    diameterMm: pos,
    thicknessMm: pos,
    lugToLugMm: pos,
    lugWidthMm: pos,
    material: z.enum(['steel', 'gold', 'titanium']),
    finish: z.object({ top: Finish, flank: Finish }),
    flank: z.enum(['straight', 'sloped']),
    // Polished bevel between the brushed top and the flank, measured across the top face.
    chamferMm: z.number().min(0),
    // Lugs in top view: width at the case, tip width as a fraction of that, and through-drilled spring-bar holes.
    lugs: z.object({ widthMm: pos, taper: z.number().gt(0).max(1), drilled: z.boolean() }),
  }),
  bezel: z.object({ kind: z.enum(['plain', 'dive']), widthMm: pos, profile: z.enum(['sloped', 'rounded']).optional(), finish: Finish, color: z.string().optional(), insertColor: z.string().optional() }),
  crown: z.object({ diameterMm: pos, lengthMm: pos, tube: z.boolean(), tubeColor: z.string().optional(), guards: z.boolean() }),
  crystal: z.object({ domeMm: z.number().min(0) }),
  dial: z.object({
    color: z.string(),
    finish: z.enum(['matte', 'gloss', 'sunburst']),
    indices: z.enum(['diver-dots', 'bars-minute', 'arabic-24']),
    indexColor: z.string(),
    lume: z.string().optional(),
    dateWindow: z.boolean(),
  }),
  // `color` is the metal (or paint) of the hand frames; the fill is the dial's lume. `secondsDot` is a diver's lume disc on the seconds hand.
  hands: z.object({ style: z.enum(['syringe', 'sword', 'pencil', 'baton']), color: z.enum(['white', 'silver', 'blued']), seconds: z.boolean(), secondsDot: z.boolean().optional() }),
  strap: z.object({ kind: z.enum(['leather', 'bracelet', 'fabric']), color: z.string() }),
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
  movement: z.object({ name: z.string(), vph: z.number().int().positive(), powerReserveH: z.number().positive(), sourceIds: z.array(z.string()).min(1) }).optional(),
  exterior: WatchExteriorSchema,
  sources: z.array(SourceSchema).min(1),
});

export type WatchExterior = z.infer<typeof WatchExteriorSchema>;
export type Watch = z.infer<typeof WatchSchema>;

export function validateWatch(w: Watch, calibers: Record<string, { specs: { diameterMm: number } }>): string[] {
  const c = calibers[w.caliberId];
  if (!c) return [`${w.id}: unknown caliber ${w.caliberId}`];
  const errors: string[] = [];
  const e = w.exterior;
  // The case needs a casing ring and a wall around the movement.
  if (e.case.diameterMm < c.specs.diameterMm + 4) errors.push(`${w.id}: case ${e.case.diameterMm} mm cannot hold a ${c.specs.diameterMm} mm movement`);
  if (e.case.lugToLugMm <= e.case.diameterMm) errors.push(`${w.id}: lug-to-lug must exceed the case diameter`);
  // Lugs grow out of the round case; past its radius they would hang off the side with nothing to fuse into.
  if (e.case.lugWidthMm / 2 + e.case.lugs.widthMm >= e.case.diameterMm / 2 - 1) errors.push(`${w.id}: lugs are wider than the case`);
  if (e.bezel.widthMm >= e.case.diameterMm / 4) errors.push(`${w.id}: bezel too wide`);
  return errors;
}
