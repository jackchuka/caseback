export const BALANCE_AMPLITUDE = 2.44; // rad, about ±140°
export const FORK_AMPLITUDE = 0.17; // rad
const IMPULSE_WINDOW = 0.12; // fraction of a beat spent in impulse

const impulse = (fraction: number) => Math.min(1, fraction / IMPULSE_WINDOW);

// One beat = one vibration (half an oscillation). The escape wheel advances half a tooth per beat.
export function escapementState(t: number, vph: number, escapeTeeth: number) {
  const frequency = vph / 7200;
  const balance = BALANCE_AMPLITUDE * Math.sin(2 * Math.PI * frequency * t);
  const beats = (t * vph) / 3600;
  const k = Math.floor(beats);
  const i = impulse(beats - k);
  const escape = -(k + i) * (Math.PI / escapeTeeth);
  const side = k % 2 === 0 ? 1 : -1;
  const fork = FORK_AMPLITUDE * side * (1 - 2 * i);
  return { balance, fork, escape };
}
