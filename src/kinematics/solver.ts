import type { Caliber, Coupling } from '../model/schema';
import { arborKey, toothCount } from '../model/validate';
import { counterSteps, heartAngle, type ChronoPose } from './chronograph';
import { escapementState } from './escapement';
import { pitchRadius, smoothstep } from './gearMath';
import { accumulateWinding } from './winding';

// Quick-set advances one date per crown turn and settles on whole dates in the second half of each turn.
export const snapDates = (q: number) => Math.floor(q) + smoothstep((q - Math.floor(q) - 0.5) / 0.5);

// After the crown is released, finish the current turn so the ring never rests between two dates.
export function settleQuick(quickRot: number, dt: number): number {
  const TAU = Math.PI * 2;
  const target = Math.ceil(quickRot / TAU - 1e-9) * TAU;
  return quickRot + Math.min(target - quickRot, dt * 4);
}

export type PartTransform = { angle: number; dz: number; dx: number; dy: number };
export type KinematicsInput = {
  t: number;
  explode: number;
  dateBase?: number;
  // Day of the week, Monday = 0, for a day ring.
  dayBase?: number;
  chrono?: ChronoPose;
  rotor?: number;
  wound?: number;
  crownPos?: 0 | 1 | 2;
  crownRot?: number;
  windRot?: number;
  quickRot?: number;
  setRot?: number;
};
export type OneWayInfo = { inputKey: string; outputKey: string; ratio: number };
// The eccentric's centre sits `throw` off its arbor at angle `rest` + the arbor's angle; the lever runs along `axis`
// (radians) from there to the driven wheel, whose claws meet it at pitch radius `radius`.
export type PawlInfo = { inputKey: string; outputKey: string; throw: number; rest: number; axis: number; radius: number };
// Whatever turns the rotor's back-and-forth into one-way winding: the input arbor's angle drives it, and it advances
// the output arbor (and so the ratchet) by `advance(previous input angle, input angle)`, never backwards.
export type Winder = { inputKey: string; outputKey: string; advance: (prev: number, next: number) => number };
// Where the chronograph takes its motion from: the oscillating pinion's and the hour counter driver's arbors, and
// what one radian of each is worth at the runner and at the hour counter.
export type ChronoInfo = { pinionKey: string; driverKey: string | null; ratios: { runner: number; hours: number } };
export type Solver = ((input: KinematicsInput) => Map<string, PartTransform>) & {
  info: { oneWay: OneWayInfo | null; pawl: PawlInfo | null; winder: Winder | null; ratchetFactor: number; chrono: ChronoInfo | null };
};

// How far the lever has been carried along its own axis by the eccentric.
export const pawlStroke = (p: PawlInfo, inputAngle: number) => p.throw * Math.cos(p.rest + inputAngle - p.axis);

// One claw pulls while the lever travels toward the eccentric, the other pushes on the way back, so every millimetre
// of stroke either way advances the wheel by the same arc.
export const pawlAdvance = (p: PawlInfo, prev: number, next: number) => Math.abs(pawlStroke(p, next) - pawlStroke(p, prev)) / p.radius;

export const couplingOf = <T extends Coupling['type']>(c: Caliber, type: T) =>
  c.couplings.find((cp): cp is Extract<Coupling, { type: T }> => cp.type === type);

export function buildSolver(c: Caliber): Solver {
  const byId = new Map(c.parts.map((p) => [p.id, p]));
  const key = (id: string) => arborKey(byId.get(id)!);
  const teeth = (id: string) => toothCount(byId.get(id)!.shape)!;
  const esc = couplingOf(c, 'escapement');
  if (!esc) throw new Error(`${c.id}: no escapement coupling`);
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
  const oneWayCp = couplingOf(c, 'one-way');
  const oneWay: OneWayInfo | null = oneWayCp
    ? { inputKey: key(oneWayCp.input), outputKey: key(oneWayCp.output), ratio: teeth(oneWayCp.input) / teeth(oneWayCp.output) }
    : null;
  const pawlCp = couplingOf(c, 'pawl');
  let pawl: PawlInfo | null = null;
  let lever: { key: string; pin0: { x: number; y: number }; wheel: { x: number; y: number }; center: { x: number; y: number } } | null = null;
  if (pawlCp) {
    const ecc = byId.get(pawlCp.eccentric)!;
    const lv = byId.get(pawlCp.lever)!;
    const wheel = byId.get(pawlCp.wheel)!;
    if (ecc.shape.kind !== 'eccentric' || wheel.shape.kind !== 'wheel') throw new Error(`${c.id}: bad pawl coupling`);
    const rest = ecc.rest ?? 0;
    const pin0 = { x: ecc.pos.x + ecc.shape.throw * Math.cos(rest), y: ecc.pos.y + ecc.shape.throw * Math.sin(rest) };
    pawl = {
      inputKey: arborKey(ecc),
      outputKey: arborKey(wheel),
      throw: ecc.shape.throw,
      rest,
      axis: Math.atan2(wheel.pos.y - pin0.y, wheel.pos.x - pin0.x),
      radius: pitchRadius(wheel.shape.teeth, wheel.shape.module),
    };
    lever = { key: arborKey(lv), pin0, wheel: wheel.pos, center: ecc.pos };
  }
  const clickCp = couplingOf(c, 'click');
  const winderOf = (): Winder | null => {
    if (oneWay) return { inputKey: oneWay.inputKey, outputKey: oneWay.outputKey, advance: (a, b) => accumulateWinding(0, a, b, oneWay.ratio) };
    if (pawl) return { inputKey: pawl.inputKey, outputKey: pawl.outputKey, advance: (a, b) => pawlAdvance(pawl, a, b) };
    if (clickCp) return { inputKey: key(clickCp.input), outputKey: key(clickCp.output), advance: (a, b) => Math.max(0, clickCp.direction * (b - a)) };
    return null;
  };
  const winder = winderOf();
  const woundFactor = winder ? bfs(winder.outputKey) : new Map<string, number>();
  // The cannon side follows the center wheel through friction, so it is its own root: setting the hands moves it alone.
  const slipCp = couplingOf(c, 'slip');
  const slip = slipCp ? { aKey: key(slipCp.a), bKey: key(slipCp.b), bTeeth: toothCount(byId.get(slipCp.b)!.shape) ?? 1 } : null;
  const cannonFactor = slip ? bfs(slip.bKey) : new Map<string, number>();
  const keylessCp = couplingOf(c, 'keyless');
  const stemYaw = keylessCp ? (byId.get(keylessCp.stem)!.yaw ?? 0) : 0;
  const keyless = keylessCp
    ? {
        stemKey: key(keylessCp.stem),
        slidingKey: key(keylessCp.slidingPinion),
        windingKey: key(keylessCp.windingPinion),
        settingKey: key(keylessCp.settingWheel),
        slidingTeeth: teeth(keylessCp.slidingPinion),
        settingTeeth: teeth(keylessCp.settingWheel),
        pull: keylessCp.pull,
        slidingThrow: keylessCp.slidingThrow,
      }
    : null;
  const ratchetPart = c.parts.find((p) => p.shape.kind === 'ratchet');
  const ratchetFactor = ratchetPart ? (woundFactor.get(arborKey(ratchetPart)) ?? 0) : 0;

  const balanceKey = key(esc.balance);
  const forkKey = key(esc.fork);

  const intermittents = c.couplings.flatMap((cp) =>
    cp.type === 'intermittent'
      ? [{ driverKey: key(cp.driver), drivenKey: key(cp.driven), teeth: teeth(cp.driven), day: cp.calendar === 'day' }]
      : [],
  );

  const chronoCp = couplingOf(c, 'chronograph');
  const chrono = chronoCp ? chronograph(chronoCp) : null;
  function chronograph(cp: Extract<Coupling, { type: 'chronograph' }>) {
    const pinion = byId.get(cp.pinion)!;
    const runner = byId.get(cp.runner)!;
    const pinionKey = arborKey(pinion);
    const hours = cp.hours ? { driverKey: key(cp.hours.driver), key: key(cp.hours.wheel), ratio: -teeth(cp.hours.driver) / teeth(cp.hours.wheel) } : null;
    const minutes = cp.minutes ? { key: key(cp.minutes.wheel), teeth: teeth(cp.minutes.wheel) } : null;
    // Out of mesh, the pinion stands `swing` further from the runner along the line between their centres.
    const d = Math.hypot(pinion.pos.x - runner.pos.x, pinion.pos.y - runner.pos.y);
    const away = { x: (pinion.pos.x - runner.pos.x) / d, y: (pinion.pos.y - runner.pos.y) / d };
    const info: ChronoInfo = { pinionKey, driverKey: hours?.driverKey ?? null, ratios: { runner: -teeth(cp.pinion) / teeth(cp.runner), hours: hours?.ratio ?? 0 } };
    return {
      info,
      pinionId: pinion.id,
      swing: cp.swing,
      away,
      runner: { key: arborKey(runner), factor: bfs(arborKey(runner)) },
      minutes: minutes && { ...minutes, factor: bfs(minutes.key) },
      hours: hours && { key: hours.key, factor: bfs(hours.key) },
      camKey: key(cp.cam),
      camTeeth: teeth(cp.cam),
      hammers: cp.hammers.map((id) => ({ id, dir: { x: Math.cos(byId.get(id)!.rest ?? 0), y: Math.sin(byId.get(id)!.rest ?? 0) } })),
      stroke: cp.stroke,
    };
  }
  const WINDOW = 0.1; // the driven part moves during the last 10 % of each driver turn

  const solver = (({ t, explode, dateBase = 0, dayBase = 0, chrono: pose, rotor = 0, wound = 0, crownPos = 0, crownRot = 0, windRot = 0, quickRot = 0, setRot = 0 }: KinematicsInput) => {
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
      // Quick-set corrects the date only; the day follows the days that pass.
      const base = im.day ? dayBase : dateBase + snapDates(quickRot / (Math.PI * 2));
      byKey.set(im.drivenKey, sign * (base + whole + step) * ((Math.PI * 2) / im.teeth));
    }
    const dx = new Map<string, number>();
    const dy = new Map<string, number>();
    // Offsets for one part rather than its whole arbor; only a chronograph moves single parts.
    const shift = chrono ? new Map<string, { x: number; y: number }>() : null;
    if (chrono && shift) {
      const p = pose ?? { runner: 0, hours: 0, engage: 0, cam: 0, hammer: 1, zero: 0 };
      const home = (factor: Map<string, number>, root: number) => {
        for (const [key, f] of factor) byKey.set(key, f * heartAngle(root, p.zero));
      };
      home(chrono.runner.factor, p.runner);
      if (chrono.minutes) home(chrono.minutes.factor, counterSteps(p.runner) * ((Math.PI * 2) / chrono.minutes.teeth));
      if (chrono.hours) home(chrono.hours.factor, p.hours);
      byKey.set(chrono.camKey, (p.cam * Math.PI * 2) / chrono.camTeeth);
      const out = chrono.swing * (1 - p.engage);
      shift.set(chrono.pinionId, { x: chrono.away.x * out + 0, y: chrono.away.y * out + 0 });
      for (const h of chrono.hammers) shift.set(h.id, { x: h.dir.x * chrono.stroke * p.hammer + 0, y: h.dir.y * chrono.stroke * p.hammer + 0 });
    }
    if (pawl && lever) {
      // The lever's hub rides the eccentric's centre and its claws stay on the wheel, so it slides and swings a little.
      const psi = pawl.rest + (byKey.get(pawl.inputKey) ?? 0);
      const pin = { x: lever.center.x + pawl.throw * Math.cos(psi), y: lever.center.y + pawl.throw * Math.sin(psi) };
      dx.set(lever.key, pin.x - lever.pin0.x);
      dy.set(lever.key, pin.y - lever.pin0.y);
      byKey.set(lever.key, Math.atan2(lever.wheel.y - pin.y, lever.wheel.x - pin.x) - pawl.axis);
    }
    if (keyless) {
      byKey.set(keyless.stemKey, crownRot);
      byKey.set(keyless.slidingKey, crownRot);
      byKey.set(keyless.windingKey, windRot);
      byKey.set(keyless.settingKey, -setRot * (keyless.slidingTeeth / keyless.settingTeeth));
      // Pulled along the stem's own axis.
      const along = (key: string, d: number) => {
        dx.set(key, d * Math.cos(stemYaw) + 0);
        dy.set(key, d * Math.sin(stemYaw) + 0);
      };
      along(keyless.stemKey, crownPos * keyless.pull);
      // At position 2 the sliding pinion moves inward onto the setting wheel.
      along(keyless.slidingKey, crownPos * keyless.pull + (crownPos === 2 ? -keyless.slidingThrow : 0));
    }
    const out = new Map<string, PartTransform>();
    for (const p of c.parts) {
      const angle = byKey.get(arborKey(p)) ?? 0;
      const own = shift?.get(p.id);
      out.set(p.id, { angle: angle === 0 ? 0 : angle, dz: p.explode.dz * e, dx: own?.x ?? dx.get(arborKey(p)) ?? 0, dy: own?.y ?? dy.get(arborKey(p)) ?? 0 });
    }
    return out;
  }) as Solver;
  solver.info = { oneWay, pawl, winder, ratchetFactor, chrono: chrono?.info ?? null };
  return solver;
}
