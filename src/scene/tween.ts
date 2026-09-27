import type { V3 } from './focus';

export type Shot = { target: V3; position: V3; flip: number; duration: number; delay: number };

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

const lerp = (a: V3, b: V3, q: number): V3 => [a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, a[2] + (b[2] - a[2]) * q];

export class Tween {
  private elapsed = 0;
  constructor(
    private readonly fromPos: V3,
    private readonly fromTarget: V3,
    private readonly shot: Shot,
    private readonly fromFlip = 0,
  ) {}

  step(dt: number): { position: V3; target: V3; flip: number; done: boolean } {
    this.elapsed += dt;
    const raw = this.shot.duration <= 0 ? 1 : (this.elapsed - this.shot.delay) / this.shot.duration;
    const t = Math.min(1, Math.max(0, raw));
    if (t >= 1) return { position: this.shot.position, target: this.shot.target, flip: this.shot.flip, done: true };
    const q = easeInOutCubic(t);
    return {
      position: lerp(this.fromPos, this.shot.position, q),
      target: lerp(this.fromTarget, this.shot.target, q),
      flip: this.fromFlip + (this.shot.flip - this.fromFlip) * q,
      done: false,
    };
  }
}
