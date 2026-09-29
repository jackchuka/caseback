import type { P2 } from '../../src/kinematics/gearMath';

export const sourced = (...sourceIds: string[]) => ({ confidence: 'sourced' as const, sourceIds });
export const estimated = (note: string, ...sourceIds: string[]) => ({ confidence: 'estimated' as const, sourceIds, note });

// Arbor pins run from the plate to the top of the bridge that holds them, not a fixed length.
export const pinSpanner =
  (plateBack: number, bridge: number) =>
  (z: number, bridgeZ: number, t = bridge) => ({ below: z - plateBack, above: bridgeZ + t / 2 - z });

// Discs of radius r every ~1.2 mm from a to b: the webs that join a bridge's lobes into one plate.
export const chain = (a: P2, b: P2, r: number) => {
  const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 1.2));
  return Array.from({ length: n - 1 }, (_, i) => ({ x: a.x + ((b.x - a.x) * (i + 1)) / n, y: a.y + ((b.y - a.y) * (i + 1)) / n, r }));
};
export const BLEND = 1.5;

// The fork's pallets (+Y) face the escape wheel; the balance's roller jewel (+X) faces the fork.
export const escapementRests = (escape: P2, fork: P2, balance: P2) => ({
  forkRest: Math.atan2(escape.y - fork.y, escape.x - fork.x) - Math.PI / 2,
  balanceRest: Math.atan2(fork.y - balance.y, fork.x - balance.x),
});
