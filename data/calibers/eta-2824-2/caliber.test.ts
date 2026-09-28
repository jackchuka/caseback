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

describe('ETA 2824-2 dial side', () => {
  it('minute hand turns once per hour, clockwise from the dial (positive local angle)', () => {
    const d = solve({ t: 3600, explode: 0 }).get('minute-hand')!.angle - solve({ t: 0, explode: 0 }).get('minute-hand')!.angle;
    expect(d).toBeCloseTo(TAU, 9);
  });
  it('hour hand turns once per 12 hours', () => {
    expect(turns('hour-hand', 43200)).toBeCloseTo(1, 9);
  });
  it('date driving wheel turns once per day and the ring advances one date', () => {
    expect(turns('date-driver', 86400)).toBeCloseTo(1, 9);
    const r = (t: number) => solve({ t, explode: 0 }).get('date-ring')!.angle;
    expect(Math.abs(r(86400 + 60) - r(60))).toBeCloseTo(TAU / 31, 9);
  });
  it('hands show 10:08 at 10:08:00', () => {
    const t = 10 * 3600 + 8 * 60;
    const m = solve({ t, explode: 0 }).get('minute-hand')!.angle - solve({ t: 0, explode: 0 }).get('minute-hand')!.angle;
    const h = solve({ t, explode: 0 }).get('hour-hand')!.angle - solve({ t: 0, explode: 0 }).get('hour-hand')!.angle;
    expect((m / TAU) % 1).toBeCloseTo(8 / 60, 6);
    expect(h / TAU).toBeCloseTo((10 + 8 / 60) / 12, 6);
  });
});

describe('ETA 2824-2 explode and date finger', () => {
  const half = (p: (typeof c.parts)[number]) => {
    const s = p.shape;
    if (s.kind === 'pinion') return s.length / 2;
    if ('thickness' in s) return s.thickness / 2 + 0.12;
    return 0.2;
  };
  const plate = c.parts.find((p) => p.id === 'plate')!;
  const overlap = (p: (typeof c.parts)[number], e: number) => {
    const pz = plate.pos.z + plate.explode.dz * e;
    const z = p.pos.z + p.explode.dz * e;
    return Math.max(0, Math.min(pz + half(plate), z + half(p)) - Math.max(pz - half(plate), z - half(p)));
  };
  it('dial parts leave the plate when exploded', () => {
    for (const p of c.parts.filter((q) => q.side === 'dial')) {
      expect(overlap(p, 1), p.id).toBe(0);
      expect(overlap(p, 0.5), p.id).toBeLessThanOrEqual(overlap(p, 0));
    }
  });
  it('the date finger reaches furthest out while the ring jumps', () => {
    const dd = c.parts.find((p) => p.id === 'date-driver')!;
    if (dd.shape.kind !== 'date-driver') throw new Error('shape');
    const L = dd.shape.fingerLength;
    let best = { r: 0, f: 0 };
    for (let i = 0; i < 1000; i++) {
      const f = i / 1000;
      const a = (dd.rest ?? 0) + solve({ t: f * 86400, explode: 0 }).get('date-driver')!.angle;
      const x = dd.pos.x - Math.sin(a) * L;
      const y = dd.pos.y + Math.cos(a) * L;
      const r = Math.hypot(x, y);
      if (r > best.r) best = { r, f };
    }
    expect(best.f).toBeGreaterThanOrEqual(0.9);
    expect(best.f).toBeLessThan(1);
  });
});

describe('ETA 2824-2 automatic', () => {
  it('rotor drives reversers, one-way cut, ratchet winds the barrel side', () => {
    expect(solve.info.oneWay?.inputKey).toBe('reverser-a');
    expect(Math.abs(solve.info.ratchetFactor)).toBeGreaterThan(0);
    expect(solve({ t: 0, explode: 0, rotor: 1 }).get('reverser-b')!.angle).toBe(0);
  });
  it('one ratchet turn adds seven hours', async () => {
    const { reserveHours } = await import('../../../src/kinematics/winding');
    expect(reserveHours(c, 1, 0, 10)).toBeCloseTo(17);
  });
});

describe('ETA 2824-2 depth', () => {
  const part = (id: string) => c.parts.find((p) => p.id === id)!;
  const thick = (id: string) => {
    const s = part(id).shape as { thickness?: number; length?: number };
    return s.thickness ?? s.length ?? 0;
  };
  const top = (id: string) => part(id).pos.z + thick(id) / 2;
  const bottom = (id: string) => part(id).pos.z - thick(id) / 2;
  const plateFront = bottom('plate');

  it('measures 4.60 mm from the plate dial face to the rotor back, as ETA publishes (rotor included)', () => {
    expect(top('rotor') - plateFront).toBeGreaterThan(4.3);
    expect(top('rotor') - plateFront).toBeLessThan(4.9);
  });
  it('keeps the dial side where it was', () => {
    expect(part('plate').pos.z).toBe(-0.6);
    for (const p of c.parts.filter((q) => q.side === 'dial')) expect(p.pos.z, p.id).toBeLessThanOrEqual(-1.2);
  });
  it('stacks train, bridges, automatic works and rotor in order', () => {
    const train = ['center-wheel', 'third-wheel', 'fourth-wheel', 'escape-wheel', 'pallet-fork', 'balance-wheel', 'hairspring'];
    const bridges = ['train-bridge', 'barrel-bridge', 'balance-cock'];
    const auto = ['reverser-a', 'reverser-b', 'reduction-wheel'];
    for (const t of train) for (const b of bridges) expect(top(t), `${t} under ${b}`).toBeLessThan(bottom(b));
    for (const a of auto) for (const b of bridges) expect(bottom(a), `${a} over ${b}`).toBeGreaterThan(top(b) - 0.01);
    for (const a of auto) expect(top(a), `${a} under rotor`).toBeLessThan(bottom('rotor'));
    for (const t of ['barrel', ...train]) expect(bottom(t), `${t} above plate`).toBeGreaterThanOrEqual(top('plate') - 0.01);
  });
  it('keeps the barrel drum under its bridge', () => {
    const s = part('barrel').shape as { thickness: number; drumHeight: number };
    const drumTop = part('barrel').pos.z + s.thickness / 2 + s.drumHeight;
    expect(drumTop).toBeLessThan(bottom('barrel-bridge'));
  });
});

import { buildShape } from '../../../src/geometry/parts';
describe('ETA 2824-2 back-side geometry', () => {
  // World-space vertices of a part's rendered layers (parts only turn about their own axis, which doesn't move them radially).
  const verts = (id: string) => {
    const p = c.parts.find((q) => q.id === id)!;
    return buildShape(p.shape, p.material).flatMap((l) => {
      const a = l.geometry.getAttribute('position');
      return Array.from({ length: a.count }, (_, i) => ({ x: a.getX(i) + p.pos.x, y: a.getY(i) + p.pos.y, z: a.getZ(i) + p.pos.z }));
    });
  };
  const rotor = verts('rotor');
  const rotorPart = c.parts.find((p) => p.id === 'rotor')!;
  const shape = rotorPart.shape.kind === 'rotor' ? rotorPart.shape : null;
  const reach = shape?.radius ?? 0;
  // The rotor is a half disc from its hub hole out to its radius, plus a smaller steel hub boss at the centre.
  const hole = shape?.hub ?? 0;
  // The disc's bevelled inner edge reaches a little inside the hole, so look for the boss well inside it.
  const boss = Math.max(...rotor.filter((v) => Math.hypot(v.x, v.y) < hole * 0.85).map((v) => Math.hypot(v.x, v.y)));
  const discInner = Math.min(...rotor.map((v) => Math.hypot(v.x, v.y)).filter((r) => r > boss + 0.01));
  const discBottom = Math.min(...rotor.filter((v) => Math.hypot(v.x, v.y) >= discInner).map((v) => v.z));
  const hubBottom = Math.min(...rotor.filter((v) => Math.hypot(v.x, v.y) <= boss + 0.01).map((v) => v.z));

  it('keeps every other back-side part, pins and screws included, under the rotor it sweeps beneath', () => {
    const others = c.parts.filter((p) => p.side === 'back' && p.arbor !== 'rotor');
    for (const p of others)
      for (const v of verts(p.id)) {
        const r = Math.hypot(v.x, v.y);
        // Between the boss and the disc's inner edge there is no rotor to hit.
        if (r > reach || (r > boss && r < discInner)) continue;
        expect(v.z, `${p.id} at r=${r.toFixed(2)}`).toBeLessThan((r <= boss ? hubBottom : discBottom) - 0.02);
      }
    // Builds every back-side part's geometry: ~2.5 s alone, slower under the parallel suite.
  }, 20_000);
  it('keeps the automatic wheels clear of the bridges, their screws and jewels', () => {
    const bridges = ['train-bridge', 'barrel-bridge', 'balance-cock'].flatMap(verts);
    for (const id of ['reverser-a', 'reverser-b', 'reduction-wheel']) {
      const p = c.parts.find((q) => q.id === id)!;
      const own = verts(id);
      const radius = Math.max(...own.map((v) => Math.hypot(v.x - p.pos.x, v.y - p.pos.y)));
      const bottom = Math.min(...own.map((v) => v.z));
      const under = bridges.filter((v) => Math.hypot(v.x - p.pos.x, v.y - p.pos.y) < radius);
      expect(Math.max(...under.map((v) => v.z)), id).toBeLessThan(bottom - 0.02);
    }
  });
});
