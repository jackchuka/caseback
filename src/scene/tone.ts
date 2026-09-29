// three.js's NeutralToneMapping (Khronos PBR Neutral), per linear RGB triple, and its inverse.
const START = 0.8 - 0.04;
const DESAT = 0.15;

export function neutral([r, g, b]: [number, number, number], exposure = 1): [number, number, number] {
  let c = [r * exposure, g * exposure, b * exposure];
  const x = Math.min(...c);
  const offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  c = c.map((v) => v - offset);
  const peak = Math.max(...c);
  if (peak < START) return c as [number, number, number];
  const d = 1 - START;
  const newPeak = 1 - (d * d) / (peak + d - START);
  const k = 1 - 1 / (DESAT * (peak - newPeak) + 1);
  return c.map((v) => v * (newPeak / peak) * (1 - k) + newPeak * k) as [number, number, number];
}

// The linear colour the curve maps onto `target`: what a scene background must be for the screen to show `target`
// when the whole frame, background included, is tone mapped (the effect composer's path).
export function neutralInverse(target: [number, number, number], exposure = 1): [number, number, number] {
  const c = [...target] as [number, number, number];
  for (let i = 0; i < 40; i++) {
    const f = neutral(c, exposure);
    for (let j = 0; j < 3; j++) c[j] = Math.max(0, c[j]! + (target[j]! - f[j]!) / exposure);
  }
  return c;
}
