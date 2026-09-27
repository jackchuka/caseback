import type { Caliber } from '../model/schema';
import { focusKey, toothCount } from '../model/validate';
import { escapementState } from './escapement';
import { smoothstep } from './gearMath';

export type PartTransform = { angle: number; dz: number };
export type KinematicsInput = { t: number; explode: number; dateBase?: number };
export type Solver = (input: KinematicsInput) => Map<string, PartTransform>;

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
      link(focusKey(a), focusKey(b), -za / zb);
      link(focusKey(b), focusKey(a), -zb / za);
    } else if (cp.type === 'slip') {
      const a = focusKey(byId.get(cp.a)!);
      const b = focusKey(byId.get(cp.b)!);
      link(a, b, 1);
      link(b, a, 1);
    }
  }

  const root = focusKey(escapePart);
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

  const balanceKey = focusKey(byId.get(esc.balance)!);
  const forkKey = focusKey(byId.get(esc.fork)!);

  const intermittents = c.couplings.flatMap((cp) =>
    cp.type === 'intermittent'
      ? [{ driverKey: focusKey(byId.get(cp.driver)!), drivenKey: focusKey(byId.get(cp.driven)!), teeth: toothCount(byId.get(cp.driven)!.shape)! }]
      : [],
  );
  const WINDOW = 0.1; // the driven part moves during the last 10 % of each driver turn

  return ({ t, explode, dateBase = 0 }) => {
    const s = escapementState(t, c.specs.vph, escapeTeeth);
    const e = smoothstep(explode);
    const byKey = new Map<string, number>();
    for (const [key, f] of factor) byKey.set(key, f * s.escape);
    byKey.set(balanceKey, s.balance);
    byKey.set(forkKey, s.fork);
    for (const im of intermittents) {
      const driver = byKey.get(im.driverKey) ?? 0;
      const turns = Math.abs(driver) / (Math.PI * 2);
      const whole = Math.floor(turns);
      const step = smoothstep((turns - whole - (1 - WINDOW)) / WINDOW);
      const sign = driver < 0 ? -1 : 1;
      byKey.set(im.drivenKey, sign * (dateBase + whole + step) * ((Math.PI * 2) / im.teeth));
    }
    const out = new Map<string, PartTransform>();
    for (const p of c.parts) {
      const angle = byKey.get(focusKey(p)) ?? 0;
      out.set(p.id, { angle: angle === 0 ? 0 : angle, dz: p.explode.dz * e });
    }
    return out;
  };
}
