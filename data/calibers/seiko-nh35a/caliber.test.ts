import { describe, expect, it } from 'vitest';
import { calibers } from '../index';
import { caliberKit, TAU } from '../testkit';
import { pawlAdvance } from '../../../src/kinematics/solver';
import { centerDistance } from '../../../src/kinematics/gearMath';
import { hoursPerBarrelTurn, reserveHours } from '../../../src/kinematics/winding';
import { toothCount } from '../../../src/model/validate';
import { buildShape } from '../../../src/geometry/parts';
import { movementFrame } from '../../../src/scene/exterior/frame';

const { c, solve, part, angle, turns } = caliberKit('seiko-nh35a');

describe('Seiko NH35A registry and specs', () => {
  it('loads next to the 2824-2 with SII\'s published figures', () => {
    expect(Object.keys(calibers)).toEqual(expect.arrayContaining(['eta-2824-2', 'seiko-nh35a']));
    expect(c.specs).toMatchObject({ diameterMm: 27.4, heightMm: 5.32, jewels: 24, vph: 21600, powerReserveH: 41, hacking: true, quickDate: true });
  });
});

describe('Seiko NH35A going train', () => {
  it('turns the centre wheel once an hour and the fourth wheel once a minute', () => {
    expect(turns('center-wheel', 3600)).toBeCloseTo(1, 9);
    expect(turns('fourth-wheel', 60)).toBeCloseTo(1, 9);
  });
  it('runs the escape wheel at 21,600 vph, a 3 Hz balance', () => {
    const escTeeth = toothCount(part('escape-wheel').shape)!;
    expect(turns('escape-wheel', 3600) * escTeeth * 2).toBeCloseTo(21600, 6);
    expect(c.specs.vph / 7200).toBe(3);
  });
  it('carries the seconds on the centre: the fourth wheel sits on the centre wheel\'s axis', () => {
    expect(part('fourth-wheel').pos).toMatchObject({ x: 0, y: 0 });
    expect(part('fourth-wheel').pos.z).toBeGreaterThan(part('center-wheel').pos.z);
  });
  it('meshes every pair at exactly one centre distance', () => {
    for (const cp of c.couplings) {
      if (cp.type !== 'mesh') continue;
      const a = part(cp.a);
      const b = part(cp.b);
      if (!('module' in a.shape) || !('module' in b.shape)) throw new Error('mesh parts need a module');
      expect(a.shape.module, `${cp.a}/${cp.b}`).toBeCloseTo(b.shape.module);
      const d = Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y);
      expect(d, `${cp.a}/${cp.b}`).toBeCloseTo(centerDistance(a.shape.module, toothCount(a.shape)!, toothCount(b.shape)!), 9);
    }
  });
  it('keeps every part centre inside the 27.4 mm movement', () => {
    for (const p of c.parts) expect(Math.hypot(p.pos.x, p.pos.y), p.id).toBeLessThan(c.specs.diameterMm / 2);
  });
  it('fully winds in the 8 ratchet turns SII gives, for the published 41 h', () => {
    expect(hoursPerBarrelTurn(c) * 8).toBeCloseTo(41, 0);
    expect(reserveHours(c, 8, 0, 0)).toBeCloseTo(41, 0);
  });
});

describe('Seiko NH35A escapement layout', () => {
  const rot = (x: number, y: number, a: number) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)] as const;
  const fork = part('pallet-fork');
  const esc = part('escape-wheel');
  const bal = part('balance-wheel');
  if (fork.shape.kind !== 'pallet-fork' || esc.shape.kind !== 'escape-wheel') throw new Error('shapes');
  const f = fork.shape;
  const e = esc.shape;
  it('puts both pallet stones on the escape wheel teeth', () => {
    for (const sx of [-1, 1]) {
      const [px, py] = rot(sx * (f.span / 2 - 0.08), 1.28, fork.rest ?? 0);
      const d = Math.hypot(fork.pos.x + px - esc.pos.x, fork.pos.y + py - esc.pos.y);
      expect(d).toBeLessThanOrEqual(e.outerRadius + 0.05);
      expect(d).toBeGreaterThanOrEqual(e.outerRadius * 0.72);
    }
  });
  it('puts the fork horn at the roller jewel', () => {
    const [tx, ty] = rot(0, -f.length, fork.rest ?? 0);
    const [jx, jy] = rot(0.9, 0, bal.rest ?? 0);
    expect(Math.hypot(fork.pos.x + tx - (bal.pos.x + jx), fork.pos.y + ty - (bal.pos.y + jy))).toBeLessThan(0.3);
  });
  it('puts the balance toward 9 o\'clock and the barrel toward 12, as in SII\'s layout drawing', () => {
    expect(bal.pos.x).toBeLessThan(-6);
    expect(part('barrel').pos.y).toBeLessThan(-5);
    expect(part('first-reduction-wheel').pos.y).toBeGreaterThan(5);
  });
});

describe('Seiko NH35A dial side', () => {
  it('turns the minute hand clockwise once an hour and the hour hand once in 12', () => {
    expect(angle('minute-hand', 3600) - angle('minute-hand', 0)).toBeCloseTo(TAU, 9);
    expect(turns('hour-hand', 43200)).toBeCloseTo(1, 9);
  });
  it('seconds turn the same way as the minute hand', () => {
    expect(Math.sign(angle('fourth-wheel', 30) - angle('fourth-wheel', 0))).toBe(1);
  });
  it('turns the date driver once a day and jumps the ring one date', () => {
    expect(turns('date-driver', 86400)).toBeCloseTo(1, 9);
    const r = (t: number) => angle('date-ring', t);
    expect(Math.abs(r(86400 + 60) - r(60))).toBeCloseTo(TAU / 31, 9);
  });
  it('reaches furthest with the date finger while the ring jumps', () => {
    const dd = part('date-driver');
    if (dd.shape.kind !== 'date-driver') throw new Error('shape');
    const L = dd.shape.fingerLength;
    let best = { r: 0, f: 0 };
    for (let i = 0; i < 1000; i++) {
      const f = i / 1000;
      const a = (dd.rest ?? 0) + angle('date-driver', f * 86400);
      const r = Math.hypot(dd.pos.x - Math.sin(a) * L, dd.pos.y + Math.cos(a) * L);
      if (r > best.r) best = { r, f };
    }
    expect(best.f).toBeGreaterThanOrEqual(0.9);
    expect(best.f).toBeLessThan(1);
    const ring = part('date-ring');
    if (ring.shape.kind !== 'date-ring') throw new Error('shape');
    expect(best.r).toBeGreaterThan(ring.shape.innerRadius);
  });
  it('lets dial-side parts leave the plate when exploded', () => {
    const plate = part('plate');
    const half = (p: (typeof c.parts)[number]) => {
      const s = p.shape;
      if (s.kind === 'pinion') return s.length / 2;
      if (s.kind === 'stem') return s.radius;
      if (s.kind === 'wheel' && p.axis === 'x') return (s.teeth * s.module) / 2 + 0.2;
      if ('thickness' in s) return s.thickness / 2 + 0.12;
      return 0.2;
    };
    for (const p of c.parts.filter((q) => q.side === 'dial')) {
      const pz = plate.pos.z + plate.explode.dz;
      const z = p.pos.z + p.explode.dz;
      expect(Math.min(pz + half(plate), z + half(p)) - Math.max(pz - half(plate), z - half(p)), p.id).toBeLessThanOrEqual(0);
    }
  });
});

describe('Seiko NH35A Magic Lever', () => {
  const pawl = solve.info.pawl!;
  it('winds through the pawl lever, not reversing wheels', () => {
    expect(solve.info.oneWay).toBeNull();
    expect(pawl.inputKey).toBe('first-reduction');
    expect(pawl.outputKey).toBe('second-reduction');
    expect(Math.abs(solve.info.ratchetFactor)).toBeGreaterThan(0);
  });
  it('keeps the lever in the second reduction wheel\'s plane, where its claws engage', () => {
    // Its plan geometry (on the eccentric's pin, reaching the wheel, claws on the pitch circle) is checked by validateCaliber.
    expect(part('pawl-lever').pos.z).toBe(part('second-reduction-wheel').pos.z);
  });
  it('winds the same whichever way the rotor swings', () => {
    const ecc = (r: number) => angle('eccentric', 0, { rotor: r });
    // Three whole turns of the eccentric, one way and the other.
    const span = (3 * TAU * 58) / 56;
    let cw = 0;
    let ccw = 0;
    for (let i = 0; i < 300; i++) {
      cw += pawlAdvance(pawl, ecc((i * span) / 300), ecc(((i + 1) * span) / 300));
      ccw += pawlAdvance(pawl, ecc((-i * span) / 300), ecc((-(i + 1) * span) / 300));
    }
    expect(cw).toBeGreaterThan(0);
    expect(ccw).toBeCloseTo(cw, 6);
  });
  it('moves the lever by the eccentric\'s throw', () => {
    let far = 0;
    for (let i = 0; i < 64; i++) {
      const tr = solve({ t: 0, explode: 0, rotor: (i / 64) * TAU * 2 }).get('pawl-lever')!;
      far = Math.max(far, Math.hypot(tr.dx, tr.dy));
    }
    expect(far).toBeCloseTo(2 * pawl.throw, 2);
  });
});

describe('Seiko NH35A depth', () => {
  const thick = (id: string) => {
    const s = part(id).shape as { thickness?: number; length?: number };
    return s.thickness ?? s.length ?? 0;
  };
  const top = (id: string) => part(id).pos.z + thick(id) / 2;
  const bottom = (id: string) => part(id).pos.z - thick(id) / 2;
  const frame = movementFrame(c);

  it('measures 5.32 mm from the dial support surface to the rotor back, as SII publishes', () => {
    const support = frame.dialZ + 0.2;
    expect(frame.rotorBackZ - support).toBeGreaterThan(5.32 - 0.1);
    expect(frame.rotorBackZ - support).toBeLessThan(5.32 + 0.1);
  });
  it('sets the dial, hands and stem at SII\'s heights from the dial support surface', () => {
    const support = frame.dialZ + 0.2;
    expect(frame.frontZ).toBeCloseTo(support - 0.4, 9);
    expect(support - part('hour-hand').pos.z).toBeCloseTo(0.4 + 0.6 + 0.09, 9);
    expect(support - part('minute-hand').pos.z).toBeCloseTo(0.4 + 1.19 + 0.09, 9);
    expect(support - frame.secondsZ).toBeCloseTo(0.4 + 1.81 + 0.05, 9);
    expect(frame.stemZ - support).toBeCloseTo(1.92, 9);
    expect(frame.dateWindow).toMatchObject({ x: 10.55, width: 2.9, height: 2.0 });
  });
  it('keeps the stem inside the plate\'s thickness, in its pocket', () => {
    expect(frame.stemZ).toBeGreaterThan(bottom('plate'));
    expect(frame.stemZ).toBeLessThan(top('plate'));
  });
  it('stacks train under bridges, automatic works on top, rotor over all', () => {
    const train = ['center-wheel', 'third-wheel', 'fourth-wheel', 'escape-wheel', 'pallet-fork', 'hairspring'];
    const bridges = ['train-bridge', 'pallet-bridge', 'balance-cock'];
    const auto = ['first-reduction-wheel', 'rotor-gear', 'ratchet', 'eccentric', 'pawl-lever', 'second-reduction-wheel', 'second-reduction-pinion'];
    for (const t of train) for (const b of bridges) expect(top(t), `${t} under ${b}`).toBeLessThan(bottom(b));
    for (const a of auto) for (const b of bridges) expect(bottom(a), `${a} over ${b}`).toBeGreaterThan(top(b));
    for (const a of auto) expect(top(a), `${a} under the rotor`).toBeLessThan(bottom('rotor'));
    for (const t of ['barrel', ...train]) expect(bottom(t), `${t} above plate`).toBeGreaterThanOrEqual(top('plate') - 0.01);
    const s = part('barrel').shape as { thickness: number; drumHeight: number };
    expect(part('barrel').pos.z + s.thickness / 2 + s.drumHeight).toBeLessThan(bottom('train-bridge'));
  });
});

describe('Seiko NH35A back-side geometry', () => {
  const verts = (id: string, dx = 0, dy = 0) => {
    const p = part(id);
    return buildShape(p.shape, p.material).flatMap((l) => {
      const a = l.geometry.getAttribute('position');
      const cos = Math.cos(p.rest ?? 0), sin = Math.sin(p.rest ?? 0);
      return Array.from({ length: a.count }, (_, i) => {
        const x = a.getX(i), y = a.getY(i);
        return { x: x * cos - y * sin + p.pos.x + dx, y: x * sin + y * cos + p.pos.y + dy, z: a.getZ(i) + p.pos.z };
      });
    });
  };
  const rotorPart = part('rotor');
  const shape = rotorPart.shape.kind === 'rotor' ? rotorPart.shape : null;
  const rotorBottom = Math.min(...verts('rotor').map((v) => v.z));

  it('keeps every other back-side part, pins and screws included, under the rotor', () => {
    for (const p of c.parts.filter((q) => q.side === 'back' && q.arbor !== 'rotor'))
      for (const v of verts(p.id)) {
        if (Math.hypot(v.x, v.y) > shape!.radius) continue;
        expect(v.z, p.id).toBeLessThan(rotorBottom - 0.02);
      }
  }, 20_000);
  it('keeps the automatic wheels clear of the bridge, its screws and jewels', () => {
    const below = ['train-bridge', 'pallet-bridge', 'balance-cock'].flatMap((id) => verts(id));
    for (const id of ['first-reduction-wheel', 'rotor-gear', 'ratchet', 'second-reduction-pinion']) {
      const p = part(id);
      const own = verts(id);
      const radius = Math.max(...own.map((v) => Math.hypot(v.x - p.pos.x, v.y - p.pos.y)));
      const lowest = Math.min(...own.map((v) => v.z));
      const under = below.filter((v) => Math.hypot(v.x - p.pos.x, v.y - p.pos.y) < radius);
      if (under.length > 0) expect(Math.max(...under.map((v) => v.z)), id).toBeLessThan(lowest - 0.02);
    }
  });
  it('keeps the lever, wherever the eccentric carries it, under the automatic bridge', () => {
    const bridge = verts('automatic-bridge');
    const lowest = Math.min(...bridge.map((v) => v.z));
    for (let i = 0; i < 8; i++) {
      const tr = solve({ t: 0, explode: 0, rotor: (i / 8) * TAU * 2 }).get('pawl-lever')!;
      expect(Math.max(...verts('pawl-lever', tr.dx, tr.dy).map((v) => v.z))).toBeLessThan(lowest);
    }
  });
});
