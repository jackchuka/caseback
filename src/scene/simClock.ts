const MAX_FRAME = 0.05;

export function advance(t: number, dt: number, speed: number): number {
  return t + Math.min(dt, MAX_FRAME) * speed;
}

export const localSeconds = (d: Date) => d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
export const dayOfMonthIndex = (d: Date) => d.getDate() - 1;
