import { z } from 'zod';

const pos = z.number().positive();
const int = z.number().int().positive();
const Point = z.object({ x: z.number(), y: z.number() });

export const Vec3Schema = z.object({ x: z.number(), y: z.number(), z: z.number() });
export const PusherActionSchema = z.enum(['start-stop', 'reset']);
export const MaterialKeySchema = z.enum(['gilt', 'steel', 'rhodium', 'plate', 'balance', 'ruby', 'blued']);

export const ShapeSchema = z.discriminatedUnion('kind', [
  // `pin`: how far the visible arbor pin runs below and above the wheel's centre (plate to bridge); default ±2.1.
  z.object({ kind: z.literal('wheel'), teeth: int, module: pos, thickness: pos, spokes: z.number().int().min(0), pin: z.object({ below: pos, above: pos }).optional() }),
  z.object({ kind: z.literal('pinion'), leaves: int, module: pos, length: pos }),
  z.object({ kind: z.literal('barrel'), teeth: int, module: pos, thickness: pos, drumHeight: pos }),
  z.object({ kind: z.literal('ratchet'), teeth: int, module: pos, thickness: pos }),
  z.object({ kind: z.literal('escape-wheel'), teeth: int, outerRadius: pos, thickness: pos }),
  z.object({ kind: z.literal('pallet-fork'), span: pos, length: pos, thickness: pos }),
  z.object({ kind: z.literal('balance'), radius: pos, rimThickness: pos, arms: int, pin: z.object({ below: pos, above: pos }).optional() }),
  z.object({ kind: z.literal('hairspring'), turns: pos, innerRadius: pos, pitch: pos }),
  // `slots`: stadium-shaped through-cuts, e.g. the pocket where a stem and its pinions run inside the plate.
  z.object({ kind: z.literal('plate'), radius: pos, thickness: pos, slots: z.array(z.object({ from: Point, to: Point, r: pos })).optional() }),
  z.object({ kind: z.literal('stem'), radius: pos, length: pos }),
  z.object({ kind: z.literal('rotor'), radius: pos, hub: pos, thickness: pos }),
  z.object({ kind: z.literal('hand'), length: pos, width: pos, thickness: pos, style: z.enum(['leaf', 'sword', 'pencil', 'baton']).optional() }),
  z.object({ kind: z.literal('date-driver'), teeth: int, module: pos, thickness: pos, fingerLength: pos }),
  z.object({ kind: z.literal('date-ring'), teeth: int, innerRadius: pos, outerRadius: pos, thickness: pos }),
  // The day of the week printed around a disc's band, one per tooth, like the date ring.
  z.object({ kind: z.literal('day-ring'), teeth: int, innerRadius: pos, outerRadius: pos, thickness: pos }),
  // A heart-shaped cam: pressed by a flat hammer it turns its arbor back to zero, the shortest way round. At zero its
  // low point (the cleft) faces local +X, where the hammer lands; its high point faces −X.
  z.object({ kind: z.literal('heart'), radius: pos, thickness: pos }),
  // A switching cam: ratchet teeth that a push steps one at a time, and a lobed rim that the levers read.
  z.object({ kind: z.literal('cam'), teeth: int, radius: pos, thickness: pos }),
  // A flat lever cut to `outline` around its pivot at the origin, with a pivot hole of radius `hole`.
  z.object({ kind: z.literal('lever'), outline: z.array(Point).min(3), thickness: pos, hole: pos }),
  // A cam disc whose centre sits `throw` off its arbor along local +X.
  z.object({ kind: z.literal('eccentric'), radius: pos, throw: pos, thickness: pos }),
  // A lever whose hub (origin) rides an eccentric and whose two claws, at (length, ±reach), straddle a ratchet-toothed wheel.
  z.object({ kind: z.literal('pawl-lever'), length: pos, reach: pos, hole: pos, width: pos, thickness: pos }),
  z.object({
    kind: z.literal('bridge'),
    lobes: z.array(Point.extend({ r: pos })).min(1),
    thickness: pos,
    jewels: z.array(Point),
    screws: z.array(Point),
    // When set, the outline is the lobes' smooth union with this fillet radius instead of a hull around their centroid,
    // for long or branching bridges whose lobes do not surround one centre.
    blend: pos.optional(),
  }),
]);

export const ProvenanceSchema = z.object({
  confidence: z.enum(['sourced', 'estimated']),
  sourceIds: z.array(z.string()),
  note: z.string().optional(),
});

export const PartSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  mechanism: z.enum(['frame', 'power', 'going-train', 'escapement', 'regulator', 'motion-works', 'calendar', 'automatic', 'keyless', 'chronograph']),
  arbor: z.string().optional(),
  focus: z.string().optional(),
  axis: z.enum(['z', 'x']).optional(),
  // Turns an axis-'x' part (a stem and the pinions on it) about Z, from pointing at 3 o'clock toward 6 (rad).
  yaw: z.number().optional(),
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
  z.object({ type: z.literal('slip'), a: z.string(), b: z.string() }),
  z.object({ type: z.literal('keyless'), stem: z.string(), slidingPinion: z.string(), windingPinion: z.string(), settingWheel: z.string(), pull: pos, slidingThrow: pos }),
  z.object({ type: z.literal('one-way'), input: z.string(), output: z.string() }),
  // A finger on `driver` steps `driven` one tooth per turn: the date (from the day of the month) or the day of the week.
  z.object({ type: z.literal('intermittent'), driver: z.string(), driven: z.string(), calendar: z.enum(['date', 'day']).optional() }),
  // A click wheel: `output` turns with `input` while it turns the `direction` way (+1 or −1) and stands still the other.
  z.object({ type: z.literal('click'), input: z.string(), output: z.string(), direction: z.union([z.literal(1), z.literal(-1)]) }),
  // A chronograph. Each start/stop push steps the `cam`, which runs or stops it. While it runs, `pinion` (always
  // turned by the going train) swings `swing` mm in to mesh the `runner`; the runner's finger steps the `minutes`
  // wheel one tooth per turn, and `hours.wheel` turns with `hours.driver` through a friction clutch. At reset the
  // `hammers` drop `stroke` mm, each along its own +X, onto the `hearts`, which turn the runner and both counters to zero.
  z.object({
    type: z.literal('chronograph'),
    cam: z.string(),
    pinion: z.string(),
    runner: z.string(),
    swing: pos,
    minutes: z.object({ wheel: z.string() }).optional(),
    hours: z.object({ driver: z.string(), wheel: z.string() }).optional(),
    hearts: z.array(z.string()).min(1),
    hammers: z.array(z.string()).min(1),
    stroke: pos,
  }),
  // Seiko's Magic Lever: the eccentric drives the lever to and fro; one claw pulls, the other pushes, so the wheel
  // advances in one direction whichever way the eccentric turns.
  z.object({ type: z.literal('pawl'), eccentric: z.string(), lever: z.string(), wheel: z.string() }),
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
  ctl: z.enum(['crown', 'chrono']).optional(),
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
  // Where the exterior meets the movement where no part says so: the case front and the seconds hand.
  // dialZ and dateWindow, when given, are the maker's own figures and override what the frame would derive from parts.
  exterior: z.object({
    frontZ: z.number(),
    secondsZ: z.number(),
    dialZ: z.number().optional(),
    dateWindow: z.object({ width: pos, height: pos }).optional(),
    dayWindow: z.object({ width: pos, height: pos }).optional(),
    // Chronograph pushers: the clock hour each sits at on the case flank and the height of its axis.
    pushers: z.array(z.object({ action: PusherActionSchema, hour: z.number(), z: z.number() })).optional(),
  }),
  parts: z.array(PartSchema).min(1),
  couplings: z.array(CouplingSchema),
  chapters: z.array(ChapterSchema).min(1),
  tour: z.array(TourStepSchema).min(1),
  sources: z.array(SourceSchema),
});

export type Vec3 = z.infer<typeof Vec3Schema>;
export type MaterialKey = z.infer<typeof MaterialKeySchema>;
export type PusherAction = z.infer<typeof PusherActionSchema>;
export type Shape = z.infer<typeof ShapeSchema>;
export type Part = z.infer<typeof PartSchema>;
export type Coupling = z.infer<typeof CouplingSchema>;
export type Stat = z.infer<typeof StatSchema>;
export type TourStep = z.infer<typeof TourStepSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Caliber = z.infer<typeof CaliberSchema>;
