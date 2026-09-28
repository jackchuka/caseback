import type { Caliber } from '../../model/schema';
import type { MovementFrame } from './contract';

const WINDOW = { width: 2.4, height: 1.8 };
// Without a date ring the dial sits this far in front of the hour hand's seat.
const DIAL_CLEARANCE = 0.35;
const DEFAULT_STEM_RADIUS = 0.26;

export function movementFrame(c: Caliber): MovementFrame {
  const hour = c.parts.find((p) => p.id === 'hour-hand');
  if (!hour) throw new Error(`${c.id}: movementFrame needs an hour-hand part to place the dial`);
  const ring = c.parts.find((p) => p.shape.kind === 'date-ring');
  const stem = c.parts.find((p) => p.shape.kind === 'stem');
  const ringShape = ring?.shape.kind === 'date-ring' ? ring.shape : null;
  const day = c.parts.find((p) => p.shape.kind === 'day-ring');
  const dayShape = day?.shape.kind === 'day-ring' ? day.shape : null;
  const stemShape = stem?.shape.kind === 'stem' ? stem.shape : null;
  const plate = c.parts.find((p) => p.shape.kind === 'plate');
  const rotor = c.parts.find((p) => p.shape.kind === 'rotor');
  const half = (p: Caliber['parts'][number]) => {
    const s = p.shape as { thickness?: number; length?: number };
    return (s.thickness ?? s.length ?? 0) / 2;
  };
  return {
    diameterMm: c.specs.diameterMm,
    frontZ: c.exterior.frontZ,
    secondsZ: c.exterior.secondsZ,
    dialZ: c.exterior.dialZ ?? (ring ? (ring.pos.z + hour.pos.z) / 2 : hour.pos.z + DIAL_CLEARANCE),
    stemZ: stem?.pos.z ?? 0,
    stemEnd: stem && stemShape ? stem.pos.x + stemShape.length / 2 : null,
    stemRadius: stemShape?.radius ?? DEFAULT_STEM_RADIUS,
    // Over the middle of the ring's printed band at 3 o'clock.
    dateWindow: ringShape ? { x: (ringShape.innerRadius + ringShape.outerRadius) / 2, ...(c.exterior.dateWindow ?? WINDOW) } : null,
    dayWindow: dayShape ? { x: (dayShape.innerRadius + dayShape.outerRadius) / 2, ...(c.exterior.dayWindow ?? WINDOW) } : null,
    plateFrontZ: plate ? plate.pos.z - half(plate) : c.exterior.frontZ,
    // Without a rotor, the back of the movement is its highest back-side part.
    rotorBackZ: rotor ? rotor.pos.z + half(rotor) : Math.max(...c.parts.filter((p) => p.side === 'back').map((p) => p.pos.z + half(p))),
    extraHands: c.parts.filter((p) => p.shape.kind === 'hand' && p.id !== 'hour-hand' && p.id !== 'minute-hand').map((p) => ({ id: p.id, ...p.pos })),
    // A clock hour h points along (sin, −cos) of h/12 of a turn, 12 o'clock being −Y.
    pushers: (c.exterior.pushers ?? []).map((p) => {
      const a = (p.hour / 12) * Math.PI * 2;
      return { action: p.action, angle: Math.atan2(-Math.cos(a), Math.sin(a)), z: p.z };
    }),
  };
}
