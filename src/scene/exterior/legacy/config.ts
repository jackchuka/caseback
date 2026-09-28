import { z } from 'zod';

const pos = z.number().positive();
const Finish = z.enum(['brushed', 'polished']);

// Settings for the parametric round-case generator the first three watches were built with. Each watch moves to its
// own builder when it is rebuilt from reference photos; this file goes when the last one does.
export const LegacyConfigSchema = z.object({
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

export type LegacyConfig = z.infer<typeof LegacyConfigSchema>;

export function validateLegacy(e: LegacyConfig, movementDiameterMm: number): string[] {
  const errors: string[] = [];
  // The case needs a casing ring and a wall around the movement.
  if (e.case.diameterMm < movementDiameterMm + 4) errors.push(`case ${e.case.diameterMm} mm cannot hold a ${movementDiameterMm} mm movement`);
  if (e.case.lugToLugMm <= e.case.diameterMm) errors.push('lug-to-lug must exceed the case diameter');
  // Lugs grow out of the round case; past its radius they would hang off the side with nothing to fuse into.
  if (e.case.lugWidthMm / 2 + e.case.lugs.widthMm >= e.case.diameterMm / 2 - 1) errors.push('lugs are wider than the case');
  if (e.bezel.widthMm >= e.case.diameterMm / 4) errors.push('bezel too wide');
  return errors;
}
