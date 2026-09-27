import { z } from 'zod';

const pos = z.number().positive();
const int = z.number().int().positive();
const Point = z.object({ x: z.number(), y: z.number() });

export const Vec3Schema = z.object({ x: z.number(), y: z.number(), z: z.number() });
export const MaterialKeySchema = z.enum(['gilt', 'steel', 'rhodium', 'plate', 'balance', 'ruby', 'blued']);

export const ShapeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('wheel'), teeth: int, module: pos, thickness: pos, spokes: z.number().int().min(0) }),
  z.object({ kind: z.literal('pinion'), leaves: int, module: pos, length: pos }),
  z.object({ kind: z.literal('barrel'), teeth: int, module: pos, thickness: pos, drumHeight: pos }),
  z.object({ kind: z.literal('ratchet'), teeth: int, module: pos, thickness: pos }),
  z.object({ kind: z.literal('escape-wheel'), teeth: int, outerRadius: pos, thickness: pos }),
  z.object({ kind: z.literal('pallet-fork'), span: pos, length: pos, thickness: pos }),
  z.object({ kind: z.literal('balance'), radius: pos, rimThickness: pos, arms: int }),
  z.object({ kind: z.literal('hairspring'), turns: pos, innerRadius: pos, pitch: pos }),
  z.object({ kind: z.literal('plate'), radius: pos, thickness: pos }),
  z.object({
    kind: z.literal('bridge'),
    lobes: z.array(Point.extend({ r: pos })).min(1),
    thickness: pos,
    jewels: z.array(Point),
    screws: z.array(Point),
  }),
]);

export const ProvenanceSchema = z.object({
  confidence: z.enum(['sourced', 'estimated']),
  sourceIds: z.array(z.string()),
  note: z.string().optional(),
});

export const PartSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  mechanism: z.enum(['frame', 'power', 'going-train', 'escapement', 'regulator', 'motion-works', 'calendar', 'automatic', 'keyless']),
  arbor: z.string().optional(),
  rest: z.number().optional(),
  side: z.enum(['back', 'dial']),
  pos: Vec3Schema,
  explode: z.object({ dz: z.number() }),
  material: MaterialKeySchema,
  shape: ShapeSchema,
  provenance: ProvenanceSchema,
});

export const CouplingSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('mesh'), a: z.string(), b: z.string() }),
  z.object({ type: z.literal('escapement'), balance: z.string(), fork: z.string(), escapeWheel: z.string() }),
]);

export const StatSchema = z.object({ label: z.string(), value: z.string() });

export const TourStepSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  chapter: z.string(),
  focus: z.string().nullable(),
  side: z.enum(['back', 'dial']),
  speed: pos,
  xray: z.boolean(),
  rotor: z.enum(['show', 'xray', 'hide']),
  cameraOffset: z.tuple([z.number(), z.number(), z.number()]),
  stats: z.array(StatSchema).max(2),
});

export const ChapterSchema = z.object({ id: z.string(), flow: z.array(z.string()) });
export const SourceSchema = z.object({ id: z.string(), title: z.string(), url: z.url() });

export const CaliberSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  specs: z.object({
    diameterMm: pos,
    heightMm: pos,
    jewels: int,
    vph: int,
    powerReserveH: pos,
    hacking: z.boolean(),
    quickDate: z.boolean(),
    sourceIds: z.array(z.string()),
  }),
  parts: z.array(PartSchema).min(1),
  couplings: z.array(CouplingSchema),
  chapters: z.array(ChapterSchema).min(1),
  tour: z.array(TourStepSchema).min(1),
  sources: z.array(SourceSchema),
});

export type Vec3 = z.infer<typeof Vec3Schema>;
export type MaterialKey = z.infer<typeof MaterialKeySchema>;
export type Shape = z.infer<typeof ShapeSchema>;
export type Part = z.infer<typeof PartSchema>;
export type Coupling = z.infer<typeof CouplingSchema>;
export type Stat = z.infer<typeof StatSchema>;
export type TourStep = z.infer<typeof TourStepSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Caliber = z.infer<typeof CaliberSchema>;
