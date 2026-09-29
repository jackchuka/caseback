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

type RGB = [number, number, number];

// three.js's ACESFilmicToneMapping: its 1/0.6 pre-scale, the input and output matrices (columns as in the GLSL) and
// the RRT+ODT fit.
const IN = [[0.59719, 0.0760, 0.0284], [0.35458, 0.90834, 0.13383], [0.04823, 0.01566, 0.83777]];
const OUT = [[1.60475, -0.10208, -0.00327], [-0.53108, 1.10813, -0.07276], [-0.07367, -0.00605, 1.07602]];
const mul = (m: number[][], v: RGB): RGB => [0, 1, 2].map((i) => m[0]![i]! * v[0] + m[1]![i]! * v[1] + m[2]![i]! * v[2]) as RGB;
const fit = (v: number) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);

export function aces([r, g, b]: RGB, exposure = 1): RGB {
  const k = exposure / 0.6;
  const c = mul(OUT, mul(IN, [r * k, g * k, b * k]).map(fit) as RGB);
  return c.map((v) => Math.min(1, Math.max(0, v))) as RGB;
}

export type Tone = 'neutral' | 'aces';
const FORWARD: Record<Tone, (c: RGB, exposure?: number) => RGB> = { neutral, aces };

// The linear colour a curve maps onto `target`: what a scene background must be for the screen to show `target`
// when the whole frame, background included, is tone mapped (the effect composer's path).
export function toneInverse(tone: Tone, target: RGB, exposure = 1): RGB {
  const c = [...target] as RGB;
  for (let i = 0; i < 60; i++) {
    const f = FORWARD[tone](c, exposure);
    for (let j = 0; j < 3; j++) c[j] = Math.max(0, c[j]! + (target[j]! - f[j]!) / exposure);
  }
  return c;
}
