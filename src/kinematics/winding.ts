import type { Caliber } from '../model/schema';
import { toothCount } from '../model/validate';

export function accumulateWinding(wound: number, prevInput: number, input: number, ratio: number): number {
  return wound + Math.abs(input - prevInput) * ratio;
}

// Hours of running per barrel turn = barrel teeth / center pinion leaves (the center wheel turns once an hour).
function hoursPerBarrelTurn(c: Caliber): number {
  const barrel = c.parts.find((p) => p.shape.kind === 'barrel');
  const mesh = barrel && c.couplings.find((cp) => cp.type === 'mesh' && (cp.a === barrel.id || cp.b === barrel.id));
  if (!barrel || !mesh || mesh.type !== 'mesh') return 1;
  const other = c.parts.find((p) => p.id === (mesh.a === barrel.id ? mesh.b : mesh.a))!;
  return toothCount(barrel.shape)! / toothCount(other.shape)!;
}

export function reserveHours(c: Caliber, ratchetTurns: number, elapsedS: number, initialH: number): number {
  const h = initialH + ratchetTurns * hoursPerBarrelTurn(c) - elapsedS / 3600;
  return Math.min(c.specs.powerReserveH, Math.max(0, h));
}

export function wristSwing(seconds: number): number {
  return Math.sin(seconds * 0.7) * 1.4 + Math.sin(seconds * 0.23) * 0.8 + Math.sin(seconds * 1.9) * 0.2;
}

export function throttle(intervalMs: number): (now: number) => boolean {
  let last = -Infinity;
  return (now) => {
    if (now - last < intervalMs) return false;
    last = now;
    return true;
  };
}
