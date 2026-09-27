import type { Caliber } from '../model/schema';
import { focusKey, toothCount } from '../model/validate';
import { escapementState } from './escapement';
import { smoothstep } from './gearMath';

export type PartTransform = { angle: number; dz: number };
export type KinematicsInput = { t: number; explode: number };
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
    if (cp.type !== 'mesh') continue;
    const a = byId.get(cp.a)!;
    const b = byId.get(cp.b)!;
    const za = toothCount(a.shape)!;
    const zb = toothCount(b.shape)!;
    link(focusKey(a), focusKey(b), -za / zb);
    link(focusKey(b), focusKey(a), -zb / za);
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

  return ({ t, explode }) => {
    const s = escapementState(t, c.specs.vph, escapeTeeth);
    const e = smoothstep(explode);
    const out = new Map<string, PartTransform>();
    for (const p of c.parts) {
      const key = focusKey(p);
      const f = factor.get(key);
      const angle = key === balanceKey ? s.balance : key === forkKey ? s.fork : f === undefined ? 0 : f * s.escape;
      out.set(p.id, { angle, dz: p.explode.dz * e });
    }
    return out;
  };
}
