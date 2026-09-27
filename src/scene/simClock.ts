const MAX_FRAME = 0.05;

export function advance(t: number, dt: number, speed: number): number {
  return t + Math.min(dt, MAX_FRAME) * speed;
}
