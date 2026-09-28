import { describe, expect, it } from 'vitest';
import { calibers, getCaliber } from '../index';
import { buildSolver } from '../../../src/kinematics/solver';
import { CHRONO_REST, trackChrono, type ChronoMode, type ChronoTrack } from '../../../src/kinematics/chronograph';
import { centerDistance } from '../../../src/kinematics/gearMath';
import { hoursPerBarrelTurn, reserveHours } from '../../../src/kinematics/winding';
import { arborKey, toothCount } from '../../../src/model/validate';
import { buildShape } from '../../../src/geometry/parts';
import { movementFrame } from '../../../src/scene/exterior/frame';

const TAU = Math.PI * 2;
const c = getCaliber('valjoux-7750')!;
const solve = buildSolver(c);
const part = (id: string) => c.parts.find((p) => p.id === id)!;
const angle = (id: string, t: number, extra = {}) => solve({ t, explode: 0, ...extra }).get(id)!.angle;
const turns = (id: string, seconds: number) => Math.abs(angle(id, seconds) - angle(id, 0)) / TAU;
const pitchR = (id: string) => {
  const s = part(id).shape as { module: number };
  return (toothCount(part(id).shape)! * s.module) / 2;
};
const dist = (a: string, b: string) => Math.hypot(part(a).pos.x - part(b).pos.x, part(a).pos.y - part(b).pos.y);

// Runs the chronograph the way Movement does, frame by frame, from movement time `from` for `seconds`.
function run(track: ChronoTrack, mode: ChronoMode, presses: number, from: number, seconds: number, dt = 1 / 30) {
  const info = solve.info.chrono!;
  const key = (k: string) => c.parts.find((p) => arborKey(p) === k)!.id;
  let t = track;
  for (let s = 0; s <= seconds + 1e-9; s += dt) {
    const tr = solve({ t: from + s, explode: 0, chrono: t });
    t = trackChrono(t, { mode, presses }, info.ratios, { pinion: tr.get(key(info.pinionKey))!.angle, driver: tr.get(key(info.driverKey!))!.angle }, dt);
  }
  return t;
}

describe('Valjoux 7750 registry and specs', () => {
  it('loads beside the other calibers with ETA\'s published figures', () => {
    expect(Object.keys(calibers)).toEqual(expect.arrayContaining(['eta-2824-2', 'seiko-nh35a', 'valjoux-7750']));
    expect(c.specs).toMatchObject({ diameterMm: 30, heightMm: 7.9, jewels: 25, vph: 28800, powerReserveH: 48, hacking: true, quickDate: true });
  });
});

describe('Valjoux 7750 going train', () => {
  it('turns the great wheel once an hour, the fourth wheel once a minute and the escape wheel at 28,800 vph', () => {
    expect(turns('great-wheel', 3600)).toBeCloseTo(1, 9);
    expect(turns('fourth-wheel', 60)).toBeCloseTo(1, 9);
    expect(turns('escape-wheel', 3600) * toothCount(part('escape-wheel').shape)! * 2).toBeCloseTo(28800, 6);
  });
  it('keeps the centre free for the chronograph: the great wheel stands off it, the running seconds sit at 9', () => {
    expect(Math.hypot(part('great-wheel').pos.x, part('great-wheel').pos.y) - pitchR('great-wheel')).toBeGreaterThan(1);
    expect(part('seconds-hand').pos).toMatchObject({ x: -8.2, y: 0 });
    expect(part('seconds-hand').arbor).toBe('fourth');
    expect(part('chronograph-wheel').pos).toMatchObject({ x: 0, y: 0 });
  });
  it('meshes every pair at exactly one centre distance', () => {
    for (const cp of c.couplings) {
      if (cp.type !== 'mesh') continue;
      const a = part(cp.a);
      const b = part(cp.b);
      if (!('module' in a.shape) || !('module' in b.shape)) throw new Error('mesh parts need a module');
      expect(a.shape.module, `${cp.a}/${cp.b}`).toBeCloseTo(b.shape.module);
      expect(dist(cp.a, cp.b), `${cp.a}/${cp.b}`).toBeCloseTo(centerDistance(a.shape.module, toothCount(a.shape)!, toothCount(b.shape)!), 9);
    }
  });
  it('keeps every part centre inside the 30 mm movement', () => {
    for (const p of c.parts) expect(Math.hypot(p.pos.x, p.pos.y), p.id).toBeLessThan(c.specs.diameterMm / 2);
  });
  it('winds from empty to ETA\'s 48 h in 6.4 ratchet turns', () => {
    expect(hoursPerBarrelTurn(c)).toBeCloseTo(7.5, 9);
    expect(reserveHours(c, 6.4, 0, 0)).toBeCloseTo(48, 6);
  });
});

describe('Valjoux 7750 escapement layout', () => {
  const rot = (x: number, y: number, a: number) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)] as const;
  const fork = part('pallet-fork');
  const esc = part('escape-wheel');
  const bal = part('balance-wheel');
  if (fork.shape.kind !== 'pallet-fork' || esc.shape.kind !== 'escape-wheel' || bal.shape.kind !== 'balance') throw new Error('shapes');
  const f = fork.shape;
  const e = esc.shape;
  it('puts both pallet stones on the escape wheel teeth and the horn at the roller jewel', () => {
    for (const sx of [-1, 1]) {
      const [px, py] = rot(sx * (f.span / 2 - 0.08), 1.28, fork.rest ?? 0);
      const d = Math.hypot(fork.pos.x + px - esc.pos.x, fork.pos.y + py - esc.pos.y);
      expect(d).toBeLessThanOrEqual(e.outerRadius + 0.05);
      expect(d).toBeGreaterThanOrEqual(e.outerRadius * 0.72);
    }
    const [tx, ty] = rot(0, -f.length, fork.rest ?? 0);
    const [jx, jy] = rot(0.9, 0, bal.rest ?? 0);
    expect(Math.hypot(fork.pos.x + tx - (bal.pos.x + jx), fork.pos.y + ty - (bal.pos.y + jy))).toBeLessThan(0.3);
  });
  it('puts the balance toward 11 o\'clock and the barrel toward 6, as in the photos', () => {
    expect(bal.pos.x).toBeLessThan(-4);
    expect(bal.pos.y).toBeLessThan(-6);
    expect(Math.hypot(bal.pos.x, bal.pos.y) + (bal.shape as { radius: number }).radius).toBeLessThan(14.9);
    expect(part('barrel').pos.y).toBeGreaterThan(6);
  });
});

describe('Valjoux 7750 dial side', () => {
  it('turns the minute hand clockwise once an hour, the hour hand once in 12, and the running seconds with them', () => {
    expect(angle('minute-hand', 3600) - angle('minute-hand', 0)).toBeCloseTo(TAU, 9);
    expect(turns('hour-hand', 43200)).toBeCloseTo(1, 9);
    expect(angle('seconds-hand', 15) - angle('seconds-hand', 0)).toBeCloseTo(TAU / 4, 9);
  });
  it('turns both calendar drivers once a day, jumping the date and the day one step each', () => {
    expect(turns('date-driver', 86400)).toBeCloseTo(1, 9);
    expect(turns('day-driver', 86400)).toBeCloseTo(1, 9);
    expect(Math.abs(angle('date-ring', 86400 + 60) - angle('date-ring', 60))).toBeCloseTo(TAU / 31, 9);
    expect(Math.abs(angle('day-ring', 86400 + 60) - angle('day-ring', 60))).toBeCloseTo(TAU / 14, 9);
  });
  it('shows today\'s weekday, and quick-set moves the date but not the day', () => {
    const r = (id: string, extra = {}) => angle(id, 60, extra);
    expect(Math.abs(r('day-ring', { dayBase: 3 }) - r('day-ring'))).toBeCloseTo((3 * TAU) / 14, 9);
    expect(r('day-ring', { quickRot: TAU })).toBeCloseTo(r('day-ring'), 9);
    expect(Math.abs(r('date-ring', { quickRot: TAU }) - r('date-ring'))).toBeCloseTo(TAU / 31, 9);
  });
  it('reaches each ring\'s teeth with its finger while the ring jumps', () => {
    const reach = (driver: string, ring: string, far: boolean) => {
      const dd = part(driver);
      if (dd.shape.kind !== 'date-driver') throw new Error('shape');
      const L = dd.shape.fingerLength;
      let best = { r: far ? 0 : Infinity, f: 0 };
      for (let i = 0; i < 1000; i++) {
        const f = i / 1000;
        const a = (dd.rest ?? 0) + angle(driver, f * 86400);
        const rp = part(ring).pos;
        const r = Math.hypot(dd.pos.x - Math.sin(a) * L - rp.x, dd.pos.y + Math.cos(a) * L - rp.y);
        if (far ? r > best.r : r < best.r) best = { r, f };
      }
      expect(best.f, driver).toBeGreaterThanOrEqual(0.9);
      expect(best.f, driver).toBeLessThan(1);
      const s = part(ring).shape as { innerRadius: number };
      // The ring's teeth stand inside its inner edge.
      if (far) expect(best.r).toBeGreaterThan(s.innerRadius);
      else expect(best.r).toBeLessThan(s.innerRadius - 0.25);
    };
    reach('date-driver', 'date-ring', true);
    reach('day-driver', 'day-ring', false);
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

describe('Valjoux 7750 chronograph', () => {
  it('couples the runner to the fourth wheel through the oscillating pinion, both of whose pinions mesh at rest', () => {
    expect(dist('oscillating-pinion-lower', 'fourth-wheel')).toBeCloseTo(centerDistance(0.06, 10, 84), 9);
    expect(dist('oscillating-pinion', 'chronograph-wheel')).toBeCloseTo(centerDistance(0.12, 10, 84), 9);
    expect(solve.info.chrono).toMatchObject({ pinionKey: 'oscillating', driverKey: 'barrel' });
    // One radian of the fourth wheel is one radian of the runner: the chronograph seconds keep pace with the seconds.
    const oscPerFourth = (angle('oscillating-pinion', 10) - angle('oscillating-pinion', 0)) / (angle('fourth-wheel', 10) - angle('fourth-wheel', 0));
    expect(oscPerFourth * solve.info.chrono!.ratios.runner).toBeCloseTo(1, 9);
  });
  it('turns the runner once a minute while running and holds it while stopped', () => {
    const running = run({ ...CHRONO_REST, hammer: 0 }, 'running', 1, 1000, 15);
    expect(running.runner).toBeCloseTo(TAU / 4, 2);
    const stopped = run(running, 'stopped', 2, 1015, 10);
    expect(stopped.runner).toBe(running.runner);
    const pose = solve({ t: 1025, explode: 0, chrono: stopped });
    expect(pose.get('chrono-seconds-hand')!.angle).toBeCloseTo(TAU / 4, 2);
  });
  it('steps the 30-minute counter a tooth a minute and turns the 12-hour counter once in 12 h', () => {
    const at = (runnerTurns: number, hours: number) => solve({ t: 0, explode: 0, chrono: { runner: runnerTurns * TAU, hours, engage: 1, cam: 1, hammer: 0, zero: 0 } });
    expect(at(7.5, 0).get('minute-counter-hand')!.angle).toBeCloseTo((7 * TAU) / 30, 9);
    expect(at(30, 0).get('minute-counter-hand')!.angle).toBeCloseTo(TAU, 9);
    // Twelve hours of barrel motion through the clutch turn the hour counter once, clockwise.
    const barrelPer12h = angle('barrel', 43200) - angle('barrel', 0);
    const hours = solve.info.chrono!.ratios.hours * barrelPer12h;
    expect(hours).toBeCloseTo(TAU, 9);
    expect(at(0, hours).get('hour-counter-hand')!.angle).toBeCloseTo(TAU, 9);
  });
  it('holds the hour counter still when stopped though the barrel keeps turning', () => {
    const running = run({ ...CHRONO_REST, hammer: 0 }, 'running', 1, 0, 60);
    const stopped = run(running, 'stopped', 2, 60, 60);
    expect(running.hours).toBeGreaterThan(0);
    expect(stopped.hours).toBe(running.hours);
    expect(Math.abs(angle('barrel', 120) - angle('barrel', 60))).toBeGreaterThan(0);
  });
  it('resets the runner and both counters to zero through the hearts', () => {
    let t: ChronoTrack = { ...CHRONO_REST, hammer: 0, runner: 12.3 * TAU, hours: 1.1 };
    t = run(t, 'reset', 2, 0, 1);
    expect(t).toMatchObject({ runner: 0, hours: 0, hammer: 1 });
    const pose = solve({ t: 0, explode: 0, chrono: t });
    for (const id of ['chrono-seconds-hand', 'minute-counter-hand', 'hour-counter-hand', 'runner-heart', 'minute-heart', 'hour-heart']) expect(pose.get(id)!.angle, id).toBe(0);
  });
  it('drops each hammer onto its hearts and keeps them clear while running', () => {
    const tip = (hammer: string, heart: string, h: number) => {
      const p = part(hammer);
      if (p.shape.kind !== 'lever') throw new Error('shape');
      const tr = solve({ t: 0, explode: 0, chrono: { runner: 0, hours: 0, engage: 0, cam: 0, hammer: h, zero: 0 } }).get(hammer)!;
      const r = p.rest ?? 0;
      const hp = part(heart);
      const rad = (hp.shape as { radius: number }).radius;
      const world = p.shape.outline.map((q) => ({ x: p.pos.x + tr.dx + q.x * Math.cos(r) - q.y * Math.sin(r), y: p.pos.y + tr.dy + q.x * Math.sin(r) + q.y * Math.cos(r) }));
      // How near the hammer's outline comes to the heart's centre, less the heart's radius.
      const edge = (a: { x: number; y: number }, b: { x: number; y: number }) => {
        const dx = b.x - a.x, dy = b.y - a.y;
        const k = Math.max(0, Math.min(1, ((hp.pos.x - a.x) * dx + (hp.pos.y - a.y) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(a.x + k * dx - hp.pos.x, a.y + k * dy - hp.pos.y);
      };
      return Math.min(...world.map((a, i) => edge(a, world[(i + 1) % world.length]!))) - rad;
    };
    for (const [hammer, heart] of [['hammer', 'runner-heart'], ['hammer', 'minute-heart'], ['hour-hammer', 'hour-heart']] as const) {
      expect(tip(hammer, heart, 0), `${hammer} clear of ${heart}`).toBeGreaterThan(0.1);
      expect(Math.abs(tip(hammer, heart, 1)), `${hammer} on ${heart}`).toBeLessThan(0.2);
    }
  });
  it('places the pushers at 2 and 4 o\'clock', () => {
    expect(movementFrame(c).pushers).toEqual([
      expect.objectContaining({ action: 'start-stop', angle: expect.closeTo(-Math.PI / 6, 9) }),
      expect.objectContaining({ action: 'reset', angle: expect.closeTo(Math.PI / 6, 9) }),
    ]);
  });
});

describe('Valjoux 7750 self-winding', () => {
  it('winds only while the rotor turns clockwise seen from the back', () => {
    const w = solve.info.winder!;
    expect(solve.info.oneWay).toBeNull();
    expect(solve.info.pawl).toBeNull();
    expect(Math.abs(solve.info.ratchetFactor)).toBeGreaterThan(0);
    const input = (rotor: number) => angle('reversing-wheel', 0, { rotor });
    // Seen from the back (+Z) clockwise is a negative rotor angle.
    expect(w.advance(input(0), input(-0.5))).toBeGreaterThan(0);
    expect(w.advance(input(0), input(0.5))).toBe(0);
  });
});

describe('Valjoux 7750 depth', () => {
  const thick = (id: string) => {
    const s = part(id).shape as { thickness?: number; length?: number };
    return s.thickness ?? s.length ?? 0;
  };
  const top = (id: string) => part(id).pos.z + thick(id) / 2;
  const bottom = (id: string) => part(id).pos.z - thick(id) / 2;
  const frame = movementFrame(c);

  it('measures ETA\'s 7.90 mm from the dial support surface to the rotor back', () => {
    const support = frame.dialZ + 0.2;
    expect(frame.rotorBackZ - support).toBeGreaterThan(7.9 - 0.05);
    expect(frame.rotorBackZ - support).toBeLessThan(7.9 + 0.05);
  });
  it('keeps the stem inside the plate, in its pocket', () => {
    expect(frame.stemZ).toBeGreaterThan(bottom('plate'));
    expect(frame.stemZ).toBeLessThan(top('plate'));
  });
  it('stacks train under bridges, chronograph over them, the automatic device over that and the rotor over all', () => {
    const train = ['great-wheel', 'third-wheel', 'fourth-wheel', 'escape-wheel', 'pallet-fork', 'hairspring', 'oscillating-pinion-lower'];
    const bridges = ['barrel-bridge', 'train-bridge', 'pallet-bridge', 'balance-cock'];
    const chrono = ['chronograph-wheel', 'oscillating-pinion', 'runner-finger', 'runner-heart', 'minute-counting-wheel', 'minute-intermediate-wheel', 'minute-heart', 'cam', 'hammer'];
    const auto = ['rotor-pinion', 'reversing-wheel', 'reversing-pinion', 'reduction-wheel', 'reduction-pinion', 'ratchet-driving-wheel'];
    for (const t of train) for (const b of bridges) expect(top(t), `${t} under ${b}`).toBeLessThan(bottom(b));
    for (const x of chrono) for (const b of bridges) expect(bottom(x), `${x} over ${b}`).toBeGreaterThan(top(b));
    for (const x of chrono) expect(top(x), `${x} under the chronograph bridge`).toBeLessThan(bottom('chronograph-bridge'));
    for (const a of auto) expect(bottom(a), `${a} over the chronograph bridge`).toBeGreaterThan(top('chronograph-bridge'));
    for (const a of auto) expect(top(a), `${a} under the automatic bridge`).toBeLessThan(bottom('automatic-bridge'));
    expect(top('automatic-bridge')).toBeLessThan(bottom('rotor'));
    const s = part('barrel').shape as { thickness: number; drumHeight: number };
    expect(part('barrel').pos.z + s.thickness / 2 + s.drumHeight).toBeLessThan(bottom('barrel-bridge'));
    expect(bottom('ratchet')).toBeGreaterThan(top('barrel-bridge'));
  });
  it('puts the dial-side layers in order: day disc at the dial, then the date ring, drivers, motion works, plate', () => {
    expect(bottom('day-ring')).toBeGreaterThanOrEqual(frame.dialZ + 0.2 - 1e-9);
    // The day driver's finger reaches the star behind the day disc, not through it.
    expect(part('day-driver').pos.z - 0.3 - 0.09).toBeGreaterThan(top('day-ring'));
    // The day disc turns clear of the centre's pipes and the sub-dial arbors.
    const day = part('day-ring');
    expect(Math.hypot(day.pos.x, day.pos.y) - (day.shape as { outerRadius: number }).outerRadius).toBeGreaterThan(0.5);
    for (const h of ['seconds-hand', 'minute-counter-hand', 'hour-counter-hand']) expect(Math.hypot(part(h).pos.x - day.pos.x, part(h).pos.y - day.pos.y) - (day.shape as { outerRadius: number }).outerRadius, h).toBeGreaterThan(0.5);
    expect(top('date-ring')).toBeLessThan(bottom('date-driver'));
    expect(top('hour-counting-wheel')).toBeLessThan(bottom('hour-heart'));
    expect(top('minute-wheel')).toBeLessThan(bottom('plate'));
    for (const h of ['hour-hand', 'minute-hand', 'chrono-seconds-hand', 'seconds-hand', 'minute-counter-hand', 'hour-counter-hand']) expect(part(h).pos.z, h).toBeLessThan(frame.frontZ);
  });
});

describe('Valjoux 7750 back-side geometry', () => {
  const verts = (id: string) => {
    const p = part(id);
    return buildShape(p.shape, p.material).flatMap((l) => {
      const a = l.geometry.getAttribute('position');
      const cos = Math.cos(p.rest ?? 0), sin = Math.sin(p.rest ?? 0);
      return Array.from({ length: a.count }, (_, i) => {
        const x = a.getX(i), y = a.getY(i);
        return { x: x * cos - y * sin + p.pos.x, y: x * sin + y * cos + p.pos.y, z: a.getZ(i) + p.pos.z };
      });
    });
  };
  it('keeps every other back-side part, pins and screws included, under the rotor', () => {
    const rotorBottom = Math.min(...verts('rotor').map((v) => v.z));
    for (const p of c.parts.filter((q) => q.side === 'back' && q.arbor !== 'rotor')) {
      const top = Math.max(...verts(p.id).map((v) => v.z));
      expect(top, p.id).toBeLessThan(rotorBottom - 0.02);
    }
  }, 20_000);
  it('keeps the runner clear of the bridges\' screws and jewels under it', () => {
    const below = ['barrel-bridge', 'train-bridge', 'pallet-bridge', 'balance-cock'].flatMap(verts);
    const r = pitchR('chronograph-wheel') + 0.2;
    const under = below.filter((v) => Math.hypot(v.x, v.y) < r);
    expect(Math.max(...under.map((v) => v.z))).toBeLessThan(Math.min(...verts('chronograph-wheel').filter((v) => Math.hypot(v.x, v.y) > 1).map((v) => v.z)) - 0.02);
  });
});
