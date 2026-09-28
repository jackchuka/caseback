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
  const stemShape = stem?.shape.kind === 'stem' ? stem.shape : null;
  return {
    diameterMm: c.specs.diameterMm,
    frontZ: c.exterior.frontZ,
    secondsZ: c.exterior.secondsZ,
    dialZ: ring ? (ring.pos.z + hour.pos.z) / 2 : hour.pos.z + DIAL_CLEARANCE,
    stemZ: stem?.pos.z ?? 0,
    stemEnd: stem && stemShape ? stem.pos.x + stemShape.length / 2 : null,
    stemRadius: stemShape?.radius ?? DEFAULT_STEM_RADIUS,
    // Over the middle of the ring's printed band at 3 o'clock.
    dateWindow: ringShape ? { x: (ringShape.innerRadius + ringShape.outerRadius) / 2, ...WINDOW } : null,
  };
}
