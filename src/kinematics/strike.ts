import { smoothstep } from './gearMath';

const TAU = Math.PI * 2;
// The strike runs through the first 1 % of the hour (36 s): far slower than a real hammer's few milliseconds, so the
// blow can be seen at the chime chapter's 120×.
export const STRIKE_WINDOW = 0.01;
// Share of the window the hammer takes to reach the gong; it spends the rest falling back to its banking.
const BLOW = 0.15;

export type StrikeGeometry = { lift: number; swing: number; cock: number; turn: number; retreat: number; wheelTeeth: number };
export type StrikePose = { lever: number; hammer: number; wheel: number; switch: number; indicator: number };

// Where in the hour the minute arbor stands: 0 on the hour, rising to 1.
export const hourPhase = (angle: number) => {
  const f = angle / TAU;
  return f - Math.floor(f);
};

// An odd press count leaves the strike silent.
export const isSilent = (presses: number): boolean => presses % 2 === 1;

// 0 while chiming, 1 while silent, easing between as the pushed column wheel turns: each whole press toggles.
export function silence(presses: number): number {
  const n = Math.floor(presses);
  const e = smoothstep(presses - n);
  return isSilent(n) ? 1 - e : e;
}

// The hammer from its banking: drawn back `cock` rad against the blow as the hour passes, slowly at first and most in
// its last minutes, then on the hour flung onto the gong (`swing`) and falling back.
export function hammerAngle(p: number, swing: number, cock: number): number {
  const back = -Math.sign(swing) * cock;
  if (p >= STRIKE_WINDOW) return back * ((p - STRIKE_WINDOW) / (1 - STRIKE_WINDOW)) ** 2;
  const u = p / STRIKE_WINDOW;
  if (u < BLOW) return back + (swing - back) * smoothstep(u / BLOW);
  return swing * (1 - smoothstep((u - BLOW) / (1 - BLOW)));
}

// Every strike part's angle from the minute arbor's and the pushes. The lever and the hammer's spring work on whether
// or not the strike is silenced; silenced, the switch lever draws the hammer back out of the gong's reach, against
// the direction of its blow.
export function strikePose(minuteAngle: number, presses: number, g: StrikeGeometry): StrikePose {
  const p = hourPhase(minuteAngle);
  const s = silence(presses);
  return {
    lever: g.lift * p,
    hammer: hammerAngle(p, g.swing, g.cock) - Math.sign(g.swing) * g.retreat * s,
    wheel: (presses * TAU) / g.wheelTeeth,
    switch: g.retreat * s,
    indicator: g.turn * s,
  };
}

// Eases a press count toward the pushes seen, a whole press every `seconds`.
export const easePresses = (v: number, target: number, dt: number, seconds = 0.15) => v + Math.max(-dt / seconds, Math.min(dt / seconds, target - v));
