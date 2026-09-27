import { describe, expect, it } from 'vitest';
import { calibers, DEFAULT_CALIBER, getCaliber } from '../index';
import { buildSolver } from '../../../src/kinematics/solver';
import { centerDistance } from '../../../src/kinematics/gearMath';
import { toothCount } from '../../../src/model/validate';

const TAU = Math.PI * 2;
const c = getCaliber('eta-2824-2')!;
const solve = buildSolver(c);
const turns = (id: string, seconds: number) =>
  Math.abs(solve({ t: seconds, explode: 0 }).get(id)!.angle - solve({ t: 0, explode: 0 }).get(id)!.angle) / TAU;

describe('registry', () => {
  it('loads and validates the default caliber', () => {
    expect(DEFAULT_CALIBER).toBe('eta-2824-2');
    expect(Object.keys(calibers)).toContain('eta-2824-2');
  });
});

describe('ETA 2824-2 invariants', () => {
  it('center wheel turns once per hour', () => {
    expect(turns('center-wheel', 3600)).toBeCloseTo(1, 9);
  });
  it('fourth wheel turns once per minute', () => {
    expect(turns('fourth-wheel', 60)).toBeCloseTo(1, 9);
  });
  it('escape wheel rate matches 28,800 vph', () => {
    const escTeeth = toothCount(c.parts.find((p) => p.id === 'escape-wheel')!.shape)!;
    expect(turns('escape-wheel', 3600) * escTeeth * 2).toBeCloseTo(c.specs.vph, 6);
  });
  it('balance runs at 4 Hz', () => {
    expect(c.specs.vph / 7200).toBe(4);
  });
  it('meshing parts sit exactly one center distance apart', () => {
    for (const cp of c.couplings) {
      if (cp.type !== 'mesh') continue;
      const a = c.parts.find((p) => p.id === cp.a)!;
      const b = c.parts.find((p) => p.id === cp.b)!;
      if (!('module' in a.shape) || !('module' in b.shape)) throw new Error('mesh parts need a module');
      expect(a.shape.module).toBeCloseTo(b.shape.module);
      const d = Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y);
      expect(d).toBeCloseTo(centerDistance(a.shape.module, toothCount(a.shape)!, toothCount(b.shape)!), 9);
    }
  });
  it('keeps every part center inside the movement diameter', () => {
    for (const p of c.parts) expect(Math.hypot(p.pos.x, p.pos.y)).toBeLessThan(c.specs.diameterMm / 2);
  });
});

describe('ETA 2824-2 escapement layout', () => {
  const byId = (id: string) => c.parts.find((p) => p.id === id)!;
  const rot = (x: number, y: number, a: number) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)] as const;
  const fork = byId('pallet-fork');
  const esc = byId('escape-wheel');
  const bal = byId('balance-wheel');
  const forkShape = fork.shape;
  const escShape = esc.shape;
  if (forkShape.kind !== 'pallet-fork' || escShape.kind !== 'escape-wheel') throw new Error('shapes');
  const h = forkShape.span / 2 - 0.08;
  it('puts both pallet stones on the escape wheel teeth', () => {
    for (const sx of [-1, 1]) {
      const [px, py] = rot(sx * h, 1.28, fork.rest ?? 0);
      const d = Math.hypot(fork.pos.x + px - esc.pos.x, fork.pos.y + py - esc.pos.y);
      expect(d).toBeLessThanOrEqual(escShape.outerRadius + 0.05);
      expect(d).toBeGreaterThanOrEqual(escShape.outerRadius * 0.72);
    }
  });
  it('puts the fork horn at the roller jewel', () => {
    const [tx, ty] = rot(0, -forkShape.length, fork.rest ?? 0);
    const [jx, jy] = rot(0.9, 0, bal.rest ?? 0);
    expect(Math.hypot(fork.pos.x + tx - (bal.pos.x + jx), fork.pos.y + ty - (bal.pos.y + jy))).toBeLessThan(0.3);
  });
});
