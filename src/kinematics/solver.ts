import type { Caliber } from '../model/schema';
import { arborKey, toothCount } from '../model/validate';
import { escapementState } from './escapement';
import { smoothstep } from './gearMath';

// Quick-set advances one date per crown turn and settles on whole dates in the second half of each turn.
export const snapDates = (q: number) => Math.floor(q) + smoothstep((q - Math.floor(q) - 0.5) / 0.5);

export type PartTransform = { angle: number; dz: number; dx: number };
export type KinematicsInput = {
  t: number;
  explode: number;
  dateBase?: number;
  rotor?: number;
  wound?: number;
  crownPos?: 0 | 1 | 2;
  crownRot?: number;
  windRot?: number;
  quickRot?: number;
  setRot?: number;
};
export type OneWayInfo = { inputKey: string; outputKey: string; ratio: number };
export type Solver = ((input: KinematicsInput) => Map<string, PartTransform>) & {
  info: { oneWay: OneWayInfo | null; ratchetFactor: number };
};

export function buildSolver(c: Caliber): Solver {
  const byId = new Map(c.parts.map((p) => [p.id, p]));
  const esc = c.couplings.find((x) => x.type === 'escapement');
  if (!esc || esc.type !== 'escapement') throw new Error(`${c.id}: no escapement coupling`);
  const escapePart = byId.get(esc.escapeWheel)!;
  const escapeTeeth = toothCount(escapePart.shape);
  if (escapeTeeth === null) throw new Error(`${c.id}: escape wheel has no teeth`);

  // angle[to] = factor * angle[from] for every meshing pair, in both directions
  const edges = new Map<string, Array<{ to: string; factor: number }>>();
  const link = (from: string, to: string, factor: number) => {
    const list = edges.get(from) ?? [];
    list.push({ to, factor });
    edges.set(from, list);
  };
  for (const cp of c.couplings) {
    if (cp.type === 'mesh') {
      const a = byId.get(cp.a)!;
      const b = byId.get(cp.b)!;
      const za = toothCount(a.shape)!;
      const zb = toothCount(b.shape)!;
      link(arborKey(a), arborKey(b), -za / zb);
      link(arborKey(b), arborKey(a), -zb / za);
    }
  }

  // Each root (escapement, rotor, one-way output) drives its own connected component.
  const bfs = (root: string) => {
    const factor = new Map<string, number>([[root, 1]]);
    const queue = [root];
    while (queue.length > 0) {
      const key = queue.shift()!;
      for (const e of edges.get(key) ?? []) {
        if (factor.has(e.to)) continue;
        factor.set(e.to, factor.get(key)! * e.factor);
        queue.push(e.to);
      }
    }
    return factor;
  };
  const escapeFactor = bfs(arborKey(escapePart));
  const rotorPart = c.parts.find((p) => p.shape.kind === 'rotor');
  const rotorFactor = rotorPart ? bfs(arborKey(rotorPart)) : new Map<string, number>();
  const oneWayCp = c.couplings.find((cp) => cp.type === 'one-way');
  const oneWay: OneWayInfo | null =
    oneWayCp && oneWayCp.type === 'one-way'
      ? {
          inputKey: arborKey(byId.get(oneWayCp.input)!),
          outputKey: arborKey(byId.get(oneWayCp.output)!),
          ratio: toothCount(byId.get(oneWayCp.input)!.shape)! / toothCount(byId.get(oneWayCp.output)!.shape)!,
        }
      : null;
  const woundFactor = oneWay ? bfs(oneWay.outputKey) : new Map<string, number>();
  // The cannon side follows the center wheel through friction, so it is its own root: setting the hands moves it alone.
  const slipCp = c.couplings.find((cp) => cp.type === 'slip');
  const slip =
    slipCp && slipCp.type === 'slip'
      ? { aKey: arborKey(byId.get(slipCp.a)!), bKey: arborKey(byId.get(slipCp.b)!), bTeeth: toothCount(byId.get(slipCp.b)!.shape) ?? 1 }
      : null;
  const cannonFactor = slip ? bfs(slip.bKey) : new Map<string, number>();
  const keylessCp = c.couplings.find((cp) => cp.type === 'keyless');
  const keyless =
    keylessCp && keylessCp.type === 'keyless'
      ? {
          stemKey: arborKey(byId.get(keylessCp.stem)!),
          slidingKey: arborKey(byId.get(keylessCp.slidingPinion)!),
          windingKey: arborKey(byId.get(keylessCp.windingPinion)!),
          settingKey: arborKey(byId.get(keylessCp.settingWheel)!),
          slidingTeeth: toothCount(byId.get(keylessCp.slidingPinion)!.shape)!,
          settingTeeth: toothCount(byId.get(keylessCp.settingWheel)!.shape)!,
          pull: keylessCp.pull,
        }
      : null;
  const ratchetPart = c.parts.find((p) => p.shape.kind === 'ratchet');
  const ratchetFactor = ratchetPart ? (woundFactor.get(arborKey(ratchetPart)) ?? 0) : 0;

  const balanceKey = arborKey(byId.get(esc.balance)!);
  const forkKey = arborKey(byId.get(esc.fork)!);

  const intermittents = c.couplings.flatMap((cp) =>
    cp.type === 'intermittent'
      ? [{ driverKey: arborKey(byId.get(cp.driver)!), drivenKey: arborKey(byId.get(cp.driven)!), teeth: toothCount(byId.get(cp.driven)!.shape)! }]
      : [],
  );
  const WINDOW = 0.1; // the driven part moves during the last 10 % of each driver turn

  const solver = (({ t, explode, dateBase = 0, rotor = 0, wound = 0, crownPos = 0, crownRot = 0, windRot = 0, quickRot = 0, setRot = 0 }: KinematicsInput) => {
    const s = escapementState(t, c.specs.vph, escapeTeeth);
    const e = smoothstep(explode);
    const byKey = new Map<string, number>();
    for (const [key, f] of escapeFactor) byKey.set(key, f * s.escape);
    for (const [key, f] of rotorFactor) byKey.set(key, f * rotor);
    for (const [key, f] of woundFactor) byKey.set(key, f * wound);
    byKey.set(balanceKey, s.balance);
    byKey.set(forkKey, s.fork);
    if (slip) {
      const setOffset = keyless ? setRot * (keyless.settingTeeth / slip.bTeeth) : 0;
      const base = (byKey.get(slip.aKey) ?? 0) + setOffset;
      for (const [key, f] of cannonFactor) byKey.set(key, f * base);
    }
    for (const im of intermittents) {
      const driver = byKey.get(im.driverKey) ?? 0;
      const turns = Math.abs(driver) / (Math.PI * 2);
      const whole = Math.floor(turns);
      const step = smoothstep((turns - whole - (1 - WINDOW)) / WINDOW);
      const sign = driver < 0 ? -1 : 1;
      byKey.set(im.drivenKey, sign * (dateBase + snapDates(quickRot / (Math.PI * 2)) + whole + step) * ((Math.PI * 2) / im.teeth));
    }
    const dx = new Map<string, number>();
    if (keyless) {
      byKey.set(keyless.stemKey, crownRot);
      byKey.set(keyless.slidingKey, crownRot);
      byKey.set(keyless.windingKey, windRot);
      byKey.set(keyless.settingKey, -setRot * (keyless.slidingTeeth / keyless.settingTeeth));
      dx.set(keyless.stemKey, crownPos * keyless.pull);
      // At position 2 the sliding pinion moves inward onto the setting wheel.
      dx.set(keyless.slidingKey, crownPos * keyless.pull + (crownPos === 2 ? -1.05 : 0));
    }
    const out = new Map<string, PartTransform>();
    for (const p of c.parts) {
      const angle = byKey.get(arborKey(p)) ?? 0;
      out.set(p.id, { angle: angle === 0 ? 0 : angle, dz: p.explode.dz * e, dx: dx.get(arborKey(p)) ?? 0 });
    }
    return out;
  }) as Solver;
  solver.info = { oneWay, ratchetFactor };
  return solver;
}
