import type { Caliber, Part } from '../../../src/model/schema';
import { centerDistance, circleIntersection, place, type P2 } from '../../../src/kinematics/gearMath';

const sourced = (...sourceIds: string[]) => ({ confidence: 'sourced' as const, sourceIds });
const estimated = (note: string, ...sourceIds: string[]) => ({ confidence: 'estimated' as const, sourceIds, note });
const LAYOUT = 'Placed after photos of the 7750 and 7761 with their bridges on (balance toward 11 o\'clock, minute counter wheel at 12, barrel toward 6); sizes and tooth counts are not measured from real parts.';
const TRAIN = 'Tooth counts chosen for 1 rph at the great wheel, 1 rpm at the fourth wheel and 28,800 vph with a 20-tooth escape wheel; the real 7750 counts are not published.';
const CHRONO = 'The part and its role are from ETA\'s parts list; its size, position and tooth count are estimates.';

// The running seconds at 9, the minute counter at 12 and the hour counter at 6 sit on arbors this far from the centre
// (measured on the Sinn 103's front photo at 41 mm; see its shots).
const SUB = 8.2;
const center: P2 = { x: 0, y: 0 };
const fourth: P2 = { x: -SUB, y: 0 };
const minuteCounter: P2 = { x: 0, y: -SUB };
const hourCounter: P2 = { x: 0, y: SUB };

// Going train. The hour counter takes its drive from a pinion on the barrel, so the barrel sits beside it toward 6;
// the great wheel stands off the centre (the chronograph runner has the centre), close enough for one minute wheel to
// join its driving pinion to the cannon pinion.
const Z = { barrel: 90, greatPinion: 12, great: 80, thirdPinion: 10, third: 75, fourthPinion: 10, fourth: 84, escapePinion: 7, escape: 20 };
const M = { barrel: 0.1, great: 0.085, third: 0.075, fourth: 0.06 };
const HC = { barrelPinion: 20, wheel: 32 };
const mHC = 0.1;
const barrel = place(hourCounter, centerDistance(mHC, HC.barrelPinion, HC.wheel), 160);
const MW = { cannon: 12, minuteWheel: 36, minutePinion: 10, hourWheel: 40, dateDriver: 80 };
const mMotion = 0.1;
const mHour = 0.096;
const great = circleIntersection(center, 2 * centerDistance(mMotion, MW.cannon, MW.minuteWheel), barrel, centerDistance(M.barrel, Z.barrel, Z.greatPinion), 1);
const third = circleIntersection(great, centerDistance(M.great, Z.great, Z.thirdPinion), fourth, centerDistance(M.third, Z.third, Z.fourthPinion), -1);
const escape = place(fourth, centerDistance(M.fourth, Z.fourth, Z.escapePinion), -110);
const LINE = -64;
const fork = place(escape, 2.05, LINE);
const balance = place(fork, 3.9, LINE);
const minuteWheel = { x: great.x / 2, y: great.y / 2 };

// Chronograph. The oscillating pinion's lower pinion always meshes the fourth wheel; its upper one swings into the
// runner (the chronograph wheel) on the centre. Equal pinions and an 84-tooth runner turn the runner with the fourth
// wheel, once a minute.
const C = { oscLow: 10, oscUp: 10, runner: 84, minutes: 30, intermediate: 16, cam: 8 };
const mRunner = 0.12;
const oscillating = circleIntersection(fourth, centerDistance(M.fourth, Z.fourth, C.oscLow), center, centerDistance(mRunner, C.runner, C.oscUp), -1);
const intermediate = place(minuteCounter, centerDistance(mMotion, C.minutes, C.intermediate), 45);
// The finger meets the intermediate wheel as the runner finishes its turn: the counter's step window.
const fingerRest = Math.atan2(intermediate.y, intermediate.x) + 0.03 * Math.PI * 2;
const cam = { x: 7.2, y: -4.6 };
// The hammers drop toward 9 o'clock (−X). The back one has an arm for the runner's heart and one for the minute
// counter's; the hour hammer works the hour counter's heart on the dial side. Outlines are drawn in movement
// coordinates and turned into each lever's own frame (+X along its stroke).
const HAMMER_REST = Math.PI;
const lever = (pivot: P2, pts: Array<[number, number]>) => pts.map(([x, y]) => ({ x: pivot.x - x, y: pivot.y - y }));
const hammerPivot = { x: 4.4, y: -2.6 };
const hammerOutline = lever(hammerPivot, [[5.0, -2.2], [2.2, 1.0], [1.5, 1.0], [1.5, -0.9], [3.6, -2.6], [1.3, -7.4], [1.3, -9.0], [2.0, -9.0], [5.0, -3.0]]);
const hourHammerPivot = { x: 3.2, y: 5.2 };
const hourHammerOutline = lever(hourHammerPivot, [[3.7, 4.7], [3.9, 5.5], [1.9, 9.0], [1.3, 9.0], [1.3, 7.4], [2.6, 5.0]]);

// Calendar: two finger wheels off the hour wheel. The date disc runs round outside the sub-dial arbors; the day disc
// is a small disc of its own beside the centre, toward 3 o'clock, with its day star underneath (ETA's day star with
// dial disc), so its names run out along its radius into the window.
const dateDriver = place(center, centerDistance(mHour, MW.hourWheel, MW.dateDriver), -60);
const dayDriver = place(center, centerDistance(mHour, MW.hourWheel, MW.dateDriver), 30);
const dayDisc: P2 = { x: 1.6, y: 0 };
// Fingers (+Y) out toward the date ring's teeth and across to the day star, each in the middle of the change window
// (95 % of a turn); the drivers turn clockwise in local coordinates.
const WINDOW_AT = 0.95 * Math.PI * 2;
const dateDriverRest = (Math.atan2(dateDriver.y, dateDriver.x) - Math.PI / 2 + WINDOW_AT) % (Math.PI * 2);
const dayDriverRest = (Math.atan2(dayDisc.y - dayDriver.y, dayDisc.x - dayDriver.x) - Math.PI / 2 + WINDOW_AT) % (Math.PI * 2);
const MOTION = 'Motion-works tooth counts give the 1:12 and one turn a day for the calendar drivers; the real 7750 counts are not published.';

// Self-winding: the rotor's pinion turns the reversing wheel both ways; its click turns the reversing pinion one way
// only; the reduction wheel and the ratchet-wheel driving wheel carry that down to the ratchet on the barrel.
const A = { rotorPinion: 12, reversing: 36, reversingPinion: 8, reduction: 40, reductionPinion: 10, ratchetDrive: 40, ratchetDrivePinion: 10, ratchet: 60 };
const mAuto = 0.1;
const mRatchet = 0.12;
const ratchetDrive = place(barrel, centerDistance(mRatchet, A.ratchetDrivePinion, A.ratchet), -40);
const reversing = place(center, centerDistance(mAuto, A.rotorPinion, A.reversing), (Math.atan2(ratchetDrive.y, ratchetDrive.x) * 180) / Math.PI + 40);
const reduction = circleIntersection(reversing, centerDistance(mAuto, A.reversingPinion, A.reduction), ratchetDrive, centerDistance(mAuto, A.reductionPinion, A.ratchetDrive), 1);
const AUTO = 'Rotor, reversing wheel, reduction wheel and ratchet-wheel driving wheel are in ETA\'s parts list; winding one way only is from the sources. Sizes, tooth counts and positions are estimates.';

// Heights. ETA gives 7.90 mm overall. From the dial support surface (DIAL) back: the calendar and motion works, the
// main plate, the going train under its bridges, the chronograph works on top of them under the chronograph bridge,
// the automatic device on top of that, and the rotor. Individual heights are estimates that add up to ETA's figure.
const DIAL = -2.65;
const DIAL_THICKNESS = 0.4;
const FRONT = DIAL - DIAL_THICKNESS;
const PLATE = { front: -1.75, back: -0.25 };
const STEM_Z = -1.0;
const H = {
  dayRing: -2.595,
  dateRing: -2.4,
  dayDriver: -2.15,
  hourCounter: -2.2,
  hourWheel: -2.19,
  dateDriver: -2.1,
  motion: -1.95,
  hourHeart: -1.95,
  great: -0.1,
  thirdPinion: -0.1,
  barrel: 0.2,
  greatPinion: 0.2,
  third: 0.3,
  fourthPinion: 0.3,
  fourth: 0.85,
  escapePinion: 0.85,
  escape: 0.55,
  fork: 0.55,
  balance: 0.6,
  hairspring: 1.05,
  bridges: 1.9,
  ratchet: 2.2,
  runner: 2.5,
  counters: 2.75,
  hearts: 2.95,
  chronoBridge: 3.3,
  automatic: 3.85,
  automaticHigh: 4.1,
  autoBridge: 4.38,
  rotor: 5.05,
};
// Hands above the dial's front face: the three sub-dial hands low, then hour, minute and the chronograph seconds.
const HAND = { sub: FRONT - 0.3, hour: FRONT - 0.75, minute: FRONT - 1.25, chrono: FRONT - 1.75 };
const HANDS = 'Hand heights are estimates: sub-dial hands lowest, then hour, minute and the chronograph seconds on top.';
const BRIDGE = 0.3;
const pinSpan = (z: number, bridgeZ: number, t = BRIDGE) => ({ below: z - PLATE.back, above: bridgeZ + t / 2 - z });
const stemIn = 5.6;
const stemOut = 18.2;
const KEYLESS = 'The stem runs in a pocket in the plate; its pinions and setting wheel are illustrative.';

const forkRest = Math.atan2(escape.y - fork.y, escape.x - fork.x) - Math.PI / 2;
const balanceRest = Math.atan2(fork.y - balance.y, fork.x - balance.x);
const cockBase = place(balance, 4.4, 160);
const offset = (p: P2, dx: number, dy: number) => ({ x: p.x + dx, y: p.y + dy });
const at = (p: P2, z: number) => ({ x: p.x, y: p.y, z });
// Discs of radius r every ~1.2 mm from a to b: the webs that join a bridge's lobes into one plate.
const chain = (a: P2, b: P2, r: number) => {
  const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 1.2));
  return Array.from({ length: n - 1 }, (_, i) => ({ x: a.x + ((b.x - a.x) * (i + 1)) / n, y: a.y + ((b.y - a.y) * (i + 1)) / n, r }));
};
const BLEND = 1.5;

const barrelScrews = [place(barrel, 4.9, 60), place(barrel, 4.9, 200)];
const trainScrews = [offset(great, 1.2, -2.2), offset(third, -2.4, 1.6), offset(fourth, 1.0, 2.6)];
const chronoScrews = [offset(center, 2.2, 1.4), offset(minuteCounter, -2.0, 0.6), offset(oscillating, -0.4, -1.5)];
const autoScrews = [offset(reversing, 1.6, 1.4), offset(ratchetDrive, 1.8, -1.0)];

const parts: Part[] = [
  {
    id: 'plate', mechanism: 'frame', side: 'back', pos: at(center, (PLATE.front + PLATE.back) / 2), explode: { dz: -0.5 }, material: 'plate',
    shape: { kind: 'plate', radius: 14.9, thickness: PLATE.back - PLATE.front, slots: [{ from: { x: stemIn - 0.2, y: 0 }, to: { x: 13.6, y: 0 }, r: 1.05 }] },
    provenance: sourced('eta-tc'),
  },
  // Going train
  {
    id: 'barrel', arbor: 'barrel', mechanism: 'power', side: 'back', pos: at(barrel, H.barrel), explode: { dz: 3.2 }, material: 'gilt',
    shape: { kind: 'barrel', teeth: Z.barrel, module: M.barrel, thickness: 0.3, drumHeight: 1.3 },
    provenance: estimated('90 teeth over a 12-leaf great wheel pinion give 7.5 h per barrel turn, so ETA\'s 48 h take 6.4 turns of the ratchet.', 'eta-tc'),
  },
  {
    id: 'barrel-hour-pinion', arbor: 'barrel', focus: 'hour-counter', mechanism: 'chronograph', side: 'dial', pos: at(barrel, H.hourCounter), explode: { dz: -3.4 }, material: 'steel',
    shape: { kind: 'pinion', leaves: HC.barrelPinion, module: mHC, length: 0.25 },
    provenance: estimated('The barrel\'s own pinion drives the hour counter through its friction clutch (TimeZone); 20 leaves over the 32-tooth counting wheel give one turn in 12 hours.', 'timezone-hours'),
  },
  {
    id: 'ratchet', mechanism: 'power', side: 'back', pos: at(barrel, H.ratchet), explode: { dz: 12.5 }, material: 'steel',
    shape: { kind: 'ratchet', teeth: A.ratchet, module: mRatchet, thickness: 0.25 }, provenance: estimated(AUTO, 'eta-tc'),
  },
  {
    id: 'great-pinion', arbor: 'great', mechanism: 'going-train', side: 'back', pos: at(great, H.greatPinion), explode: { dz: 4.4 }, material: 'steel',
    shape: { kind: 'pinion', leaves: Z.greatPinion, module: M.barrel, length: 0.35 }, provenance: estimated(TRAIN, 'eta-tc'),
  },
  {
    id: 'great-wheel', arbor: 'great', mechanism: 'going-train', side: 'back', pos: at(great, H.great), explode: { dz: 4.4 }, material: 'gilt',
    shape: { kind: 'wheel', teeth: Z.great, module: M.great, thickness: 0.2, spokes: 4, pin: pinSpan(H.great, H.bridges) },
    provenance: estimated('Off the centre, which the chronograph runner takes: it turns once an hour and drives the minute hand through the motion works. ' + TRAIN, 'eta-tc'),
  },
  {
    id: 'third-pinion', arbor: 'third', mechanism: 'going-train', side: 'back', pos: at(third, H.thirdPinion), explode: { dz: 5.2 }, material: 'steel',
    shape: { kind: 'pinion', leaves: Z.thirdPinion, module: M.great, length: 0.25 }, provenance: estimated(TRAIN, 'eta-tc'),
  },
  {
    id: 'third-wheel', arbor: 'third', mechanism: 'going-train', side: 'back', pos: at(third, H.third), explode: { dz: 5.2 }, material: 'gilt',
    shape: { kind: 'wheel', teeth: Z.third, module: M.third, thickness: 0.2, spokes: 5, pin: pinSpan(H.third, H.bridges) }, provenance: estimated(TRAIN, 'eta-tc'),
  },
  {
    id: 'fourth-pinion', arbor: 'fourth', mechanism: 'going-train', side: 'back', pos: at(fourth, H.fourthPinion), explode: { dz: 6.0 }, material: 'steel',
    shape: { kind: 'pinion', leaves: Z.fourthPinion, module: M.third, length: 0.3 }, provenance: estimated(TRAIN, 'eta-tc'),
  },
  {
    id: 'fourth-wheel', arbor: 'fourth', mechanism: 'going-train', side: 'back', pos: at(fourth, H.fourth), explode: { dz: 6.0 }, material: 'gilt',
    shape: { kind: 'wheel', teeth: Z.fourth, module: M.fourth, thickness: 0.2, spokes: 5, pin: pinSpan(H.fourth, H.bridges) },
    provenance: estimated('The second wheel carries the running seconds at 9 o\'clock (ETA); 84 teeth over a 7-leaf escape pinion give 28,800 vph.', 'eta-tc', 'monochrome'),
  },
  {
    id: 'escape-pinion', arbor: 'escape', mechanism: 'escapement', side: 'back', pos: at(escape, H.escapePinion), explode: { dz: 6.8 }, material: 'steel',
    shape: { kind: 'pinion', leaves: Z.escapePinion, module: M.fourth, length: 0.3 }, provenance: estimated(TRAIN, 'eta-tc'),
  },
  {
    id: 'escape-wheel', arbor: 'escape', mechanism: 'escapement', side: 'back', pos: at(escape, H.escape), explode: { dz: 6.8 }, material: 'steel',
    shape: { kind: 'escape-wheel', teeth: Z.escape, outerRadius: 1.45, thickness: 0.16 }, provenance: estimated(TRAIN, 'eta-tc'),
  },
  {
    id: 'pallet-fork', arbor: 'fork', rest: forkRest, mechanism: 'escapement', side: 'back', pos: at(fork, H.fork), explode: { dz: 7.4 }, material: 'steel',
    shape: { kind: 'pallet-fork', span: 2.6, length: 3.0, thickness: 0.14 }, provenance: estimated(LAYOUT, 'commons-7750'),
  },
  {
    id: 'balance-wheel', arbor: 'balance', rest: balanceRest, mechanism: 'regulator', side: 'back', pos: at(balance, H.balance), explode: { dz: 9.0 }, material: 'balance',
    shape: { kind: 'balance', radius: 4.2, rimThickness: 0.22, arms: 2, pin: pinSpan(H.balance, H.bridges) }, provenance: estimated(LAYOUT, 'commons-7750', 'eta-tc'),
  },
  {
    id: 'hairspring', arbor: 'balance', mechanism: 'regulator', side: 'back', pos: at(balance, H.hairspring), explode: { dz: 9.0 }, material: 'steel',
    shape: { kind: 'hairspring', turns: 12, innerRadius: 0.55, pitch: 0.2 }, provenance: estimated(LAYOUT, 'commons-7750'),
  },
  // Bridges
  {
    id: 'barrel-bridge', mechanism: 'frame', side: 'back', pos: at(center, H.bridges), explode: { dz: 10 }, material: 'rhodium',
    shape: {
      kind: 'bridge', thickness: BRIDGE,
      lobes: [{ ...barrel, r: 3.0 }, ...barrelScrews.map((s) => ({ ...s, r: 0.9 })), ...barrelScrews.flatMap((s) => chain(barrel, s, 1.4))],
      blend: BLEND,
      // The barrel jewel sits under the ratchet.
      jewels: [],
      screws: barrelScrews,
    },
    provenance: estimated(LAYOUT, 'eta-tc'),
  },
  {
    id: 'train-bridge', mechanism: 'frame', side: 'back', pos: at(center, H.bridges), explode: { dz: 11 }, material: 'rhodium',
    shape: {
      kind: 'bridge', thickness: BRIDGE,
      lobes: [
        { ...great, r: 1.2 }, { ...third, r: 1.2 }, { ...fourth, r: 1.2 }, { ...escape, r: 1.0 }, ...trainScrews.map((s) => ({ ...s, r: 0.9 })),
        ...chain(great, third, 1.0), ...chain(third, fourth, 1.0), ...chain(fourth, escape, 0.9),
        ...chain(great, trainScrews[0]!, 0.9), ...chain(third, trainScrews[1]!, 0.9), ...chain(fourth, trainScrews[2]!, 0.9),
      ],
      blend: BLEND,
      jewels: [great, third, fourth, escape],
      screws: trainScrews,
    },
    provenance: estimated(LAYOUT, 'commons-7750'),
  },
  {
    id: 'pallet-bridge', mechanism: 'frame', side: 'back', pos: at(center, H.bridges), explode: { dz: 11.5 }, material: 'rhodium',
    shape: { kind: 'bridge', thickness: BRIDGE, lobes: [{ ...fork, r: 0.8 }, { ...offset(fork, 2.0, 0.4), r: 0.8 }, ...chain(fork, offset(fork, 2.0, 0.4), 0.6)], jewels: [fork], screws: [offset(fork, 2.0, 0.4)], blend: BLEND },
    provenance: estimated(LAYOUT, 'eta-tc'),
  },
  {
    id: 'balance-cock', mechanism: 'frame', side: 'back', pos: at(center, H.bridges), explode: { dz: 13 }, material: 'rhodium',
    shape: { kind: 'bridge', thickness: BRIDGE, lobes: [{ ...balance, r: 1.0 }, ...chain(balance, cockBase, 0.8), { ...cockBase, r: 1.3 }], jewels: [balance], screws: [cockBase], blend: BLEND },
    provenance: estimated(LAYOUT, 'commons-7750', 'eta-tc'),
  },
  // Chronograph works, on top of the going train's bridges
  {
    id: 'oscillating-pinion-lower', arbor: 'oscillating', focus: 'oscillating-pinion', mechanism: 'chronograph', side: 'back', pos: at(oscillating, H.fourth), explode: { dz: 14 }, material: 'steel',
    shape: { kind: 'pinion', leaves: C.oscLow, module: M.fourth, length: 0.25 }, provenance: estimated('Always in mesh with the fourth wheel (Revolution). ' + CHRONO, 'revolution-pinion', 'eta-tc'),
  },
  {
    id: 'oscillating-pinion', arbor: 'oscillating', focus: 'oscillating-pinion', mechanism: 'chronograph', side: 'back', pos: at(oscillating, H.runner), explode: { dz: 14 }, material: 'steel',
    shape: { kind: 'pinion', leaves: C.oscUp, module: mRunner, length: 0.25 }, provenance: estimated('The cam swings it into the chronograph wheel (Revolution). ' + CHRONO, 'revolution-pinion', 'eta-tc'),
  },
  {
    id: 'chronograph-wheel', arbor: 'runner', mechanism: 'chronograph', side: 'back', pos: at(center, H.runner), explode: { dz: 14.5 }, material: 'gilt',
    shape: { kind: 'wheel', teeth: C.runner, module: mRunner, thickness: 0.2, spokes: 5, pin: { below: H.runner - PLATE.back, above: H.chronoBridge + BRIDGE / 2 - H.runner } },
    provenance: estimated('Carries the chronograph seconds on the centre. ' + CHRONO, 'eta-tc', 'revolution-pinion'),
  },
  {
    id: 'runner-finger', arbor: 'runner', rest: fingerRest, mechanism: 'chronograph', side: 'back', pos: at(center, H.counters), explode: { dz: 14.5 }, material: 'steel',
    shape: { kind: 'lever', outline: [{ x: 3.6, y: -0.25 }, { x: 5.95, y: -0.12 }, { x: 5.95, y: 0.12 }, { x: 3.6, y: 0.25 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: -0.5 }], thickness: 0.12, hole: 0.25 },
    provenance: estimated('Steps the minute counter once per turn of the runner (TimeZone). ' + CHRONO, 'timezone-odets', 'eta-tc'),
  },
  {
    id: 'runner-heart', arbor: 'runner', mechanism: 'chronograph', side: 'back', pos: at(center, H.hearts), explode: { dz: 15 }, material: 'steel',
    shape: { kind: 'heart', radius: 1.2, thickness: 0.2 }, provenance: estimated(CHRONO, 'eta-tc', 'timezone-odets'),
  },
  {
    id: 'minute-intermediate-wheel', focus: 'minute-counter', mechanism: 'chronograph', side: 'back', pos: at(intermediate, H.counters), explode: { dz: 14.5 }, material: 'gilt',
    shape: { kind: 'wheel', teeth: C.intermediate, module: mMotion, thickness: 0.14, spokes: 0 },
    provenance: estimated('The minute counter driving wheel, on an eccentric in ETA\'s parts list. ' + CHRONO, 'eta-tc'),
  },
  {
    id: 'minute-counting-wheel', arbor: 'minute-counter', mechanism: 'chronograph', side: 'back', pos: at(minuteCounter, H.counters), explode: { dz: 14.5 }, material: 'gilt',
    shape: { kind: 'wheel', teeth: C.minutes, module: mMotion, thickness: 0.14, spokes: 0 },
    provenance: estimated('30 teeth, one per minute, for the 30-minute counter at 12 o\'clock. ' + CHRONO, 'eta-tc', 'monochrome'),
  },
  {
    id: 'minute-heart', arbor: 'minute-counter', mechanism: 'chronograph', side: 'back', pos: at(minuteCounter, H.hearts), explode: { dz: 15 }, material: 'steel',
    shape: { kind: 'heart', radius: 1.0, thickness: 0.2 }, provenance: estimated(CHRONO, 'eta-tc'),
  },
  {
    id: 'cam', mechanism: 'chronograph', side: 'back', pos: at(cam, H.runner), explode: { dz: 15 }, material: 'steel',
    shape: { kind: 'cam', teeth: C.cam, radius: 1.5, thickness: 0.25 }, provenance: estimated('The chronograph cam: each push on the start/stop pusher steps it one tooth (Monochrome). ' + CHRONO, 'monochrome', 'eta-tc'),
  },
  {
    id: 'hammer', rest: HAMMER_REST, mechanism: 'chronograph', side: 'back', pos: at(hammerPivot, H.hearts), explode: { dz: 15.5 }, material: 'steel',
    shape: { kind: 'lever', outline: hammerOutline, thickness: 0.2, hole: 0.3 },
    provenance: estimated(CHRONO, 'eta-tc', 'timezone-odets'),
  },
  {
    id: 'chronograph-bridge', mechanism: 'frame', side: 'back', pos: at(center, H.chronoBridge), explode: { dz: 16.5 }, material: 'rhodium',
    shape: {
      kind: 'bridge', thickness: BRIDGE,
      lobes: [
        { ...center, r: 1.3 }, { ...oscillating, r: 0.9 }, { ...minuteCounter, r: 1.1 }, { ...intermediate, r: 0.8 }, ...chronoScrews.map((s) => ({ ...s, r: 0.9 })),
        ...chain(center, oscillating, 0.9), ...chain(center, intermediate, 0.9), ...chain(intermediate, minuteCounter, 0.8),
        ...chain(center, chronoScrews[0]!, 0.8), ...chain(minuteCounter, chronoScrews[1]!, 0.8), ...chain(oscillating, chronoScrews[2]!, 0.8),
      ],
      blend: BLEND,
      jewels: [center, oscillating, minuteCounter],
      screws: chronoScrews,
    },
    provenance: estimated('The chronograph bridge holds the runner, the oscillating pinion and the minute counting wheel (ETA). Outline estimated.', 'eta-tc'),
  },
  // Hour counter, on the dial side
  {
    id: 'hour-counting-wheel', arbor: 'hour-counter', mechanism: 'chronograph', side: 'dial', pos: at(hourCounter, H.hourCounter), explode: { dz: -3.4 }, material: 'gilt',
    shape: { kind: 'wheel', teeth: HC.wheel, module: mHC, thickness: 0.14, spokes: 0 },
    provenance: estimated('Always driven by the barrel, it slips on its friction clutch while the brake holds it (TimeZone). ' + CHRONO, 'timezone-hours', 'eta-tc'),
  },
  {
    id: 'hour-heart', arbor: 'hour-counter', mechanism: 'chronograph', side: 'dial', pos: at(hourCounter, H.hourHeart), explode: { dz: -3.8 }, material: 'steel',
    shape: { kind: 'heart', radius: 1.0, thickness: 0.16 }, provenance: estimated(CHRONO, 'eta-tc'),
  },
  {
    id: 'hour-hammer', focus: 'hammer', rest: HAMMER_REST, mechanism: 'chronograph', side: 'dial', pos: at(hourHammerPivot, H.hourHeart), explode: { dz: -3.8 }, material: 'steel',
    shape: { kind: 'lever', outline: hourHammerOutline, thickness: 0.16, hole: 0.25 },
    provenance: estimated('ETA lists an hour hammer with its own operating lever on the dial side. ' + CHRONO, 'eta-tc'),
  },
  // Motion works
  { id: 'driving-pinion', arbor: 'driving', focus: 'cannon', mechanism: 'motion-works', side: 'dial', pos: at(great, H.motion), explode: { dz: -2.4 }, material: 'steel', shape: { kind: 'pinion', leaves: MW.cannon, module: mMotion, length: 0.3 }, provenance: estimated('The driving pinion on the great wheel\'s arbor, held by friction so the hands can be set (ETA\'s chaussée entraîneuse). ' + MOTION, 'eta-tc') },
  { id: 'cannon-pinion', arbor: 'cannon', mechanism: 'motion-works', side: 'dial', pos: at(center, H.motion), explode: { dz: -2.4 }, material: 'steel', shape: { kind: 'pinion', leaves: MW.cannon, module: mMotion, length: 0.3 }, provenance: estimated('The free cannon pinion on the centre (ETA). ' + MOTION, 'eta-tc') },
  { id: 'minute-wheel', arbor: 'minute-wheel', mechanism: 'motion-works', side: 'dial', pos: at(minuteWheel, H.motion), explode: { dz: -3.2 }, material: 'gilt', shape: { kind: 'wheel', teeth: MW.minuteWheel, module: mMotion, thickness: 0.16, spokes: 0 }, provenance: estimated(MOTION, 'eta-tc') },
  { id: 'minute-pinion', arbor: 'minute-wheel', mechanism: 'motion-works', side: 'dial', pos: at(minuteWheel, H.hourWheel), explode: { dz: -3.2 }, material: 'steel', shape: { kind: 'pinion', leaves: MW.minutePinion, module: mHour, length: 0.3 }, provenance: estimated(MOTION, 'eta-tc') },
  { id: 'hour-wheel', arbor: 'hour', mechanism: 'motion-works', side: 'dial', pos: at(center, H.hourWheel), explode: { dz: -4.2 }, material: 'gilt', shape: { kind: 'wheel', teeth: MW.hourWheel, module: mHour, thickness: 0.3, spokes: 4 }, provenance: estimated(MOTION, 'eta-tc') },
  // Calendar
  { id: 'date-driver', arbor: 'date-driver', rest: dateDriverRest, mechanism: 'calendar', side: 'dial', pos: at(dateDriver, H.dateDriver), explode: { dz: -3.0 }, material: 'gilt', shape: { kind: 'date-driver', teeth: MW.dateDriver, module: mHour, thickness: 0.14, fingerLength: 4.6 }, provenance: estimated(MOTION, 'bobinchak-calendar') },
  { id: 'day-driver', arbor: 'day-driver', rest: dayDriverRest, mechanism: 'calendar', side: 'dial', pos: at(dayDriver, H.dayDriver), explode: { dz: -3.0 }, material: 'gilt', shape: { kind: 'date-driver', teeth: MW.dateDriver, module: mHour, thickness: 0.14, fingerLength: 2.5 }, provenance: estimated(MOTION, 'bobinchak-calendar') },
  // rest π/2 turns today's date and day from 12 o'clock to the windows at 3.
  { id: 'date-ring', rest: Math.PI / 2, mechanism: 'calendar', side: 'dial', pos: at(center, H.dateRing), explode: { dz: -1.6 }, material: 'plate', shape: { kind: 'date-ring', teeth: 31, innerRadius: 9.0, outerRadius: 12.3, thickness: 0.15 }, provenance: estimated('The date disc outside the sub-dial arbors; its band is centred under the Sinn 103\'s date window, 10.65 mm out.', 'bobinchak-calendar', 'eta-tc') },
  { id: 'day-ring', rest: Math.PI / 2, mechanism: 'calendar', side: 'dial', pos: at(dayDisc, H.dayRing), explode: { dz: -1.2 }, material: 'plate', shape: { kind: 'day-ring', teeth: 14, innerRadius: 2.2, outerRadius: 7.2, thickness: 0.1 }, provenance: estimated('A disc printed twice round with the days, on its own 14-tooth star (ETA part 2561/1), its big hole round the centre; size and place fitted to the Sinn 103\'s day window.', 'gleave-day-disc', 'eta-tc') },
  // Hands
  { id: 'hour-hand', arbor: 'hour', mechanism: 'motion-works', side: 'dial', pos: at(center, HAND.hour), explode: { dz: -6.2 }, material: 'blued', shape: { kind: 'hand', length: 7.2, width: 0.45, thickness: 0.12, style: 'baton' }, provenance: estimated(HANDS) },
  { id: 'minute-hand', arbor: 'cannon', mechanism: 'motion-works', side: 'dial', pos: at(center, HAND.minute), explode: { dz: -7.2 }, material: 'blued', shape: { kind: 'hand', length: 11.5, width: 0.36, thickness: 0.12, style: 'baton' }, provenance: estimated(HANDS) },
  { id: 'chrono-seconds-hand', arbor: 'runner', mechanism: 'chronograph', side: 'dial', pos: at(center, HAND.chrono), explode: { dz: -8.2 }, material: 'steel', shape: { kind: 'hand', length: 12.5, width: 0.14, thickness: 0.1, style: 'pencil' }, provenance: estimated(HANDS) },
  { id: 'seconds-hand', arbor: 'fourth', mechanism: 'going-train', side: 'dial', pos: at(fourth, HAND.sub), explode: { dz: -5.2 }, material: 'blued', shape: { kind: 'hand', length: 2.6, width: 0.14, thickness: 0.08, style: 'baton' }, provenance: estimated(HANDS) },
  { id: 'minute-counter-hand', arbor: 'minute-counter', mechanism: 'chronograph', side: 'dial', pos: at(minuteCounter, HAND.sub), explode: { dz: -5.2 }, material: 'blued', shape: { kind: 'hand', length: 2.6, width: 0.14, thickness: 0.08, style: 'baton' }, provenance: estimated(HANDS) },
  { id: 'hour-counter-hand', arbor: 'hour-counter', mechanism: 'chronograph', side: 'dial', pos: at(hourCounter, HAND.sub), explode: { dz: -5.2 }, material: 'blued', shape: { kind: 'hand', length: 2.6, width: 0.14, thickness: 0.08, style: 'baton' }, provenance: estimated(HANDS) },
  // Automatic device
  { id: 'rotor', arbor: 'rotor', mechanism: 'automatic', side: 'back', pos: at(center, H.rotor), explode: { dz: 20 }, material: 'gilt', shape: { kind: 'rotor', radius: 14.4, hub: 1.2, thickness: 0.45 }, provenance: estimated('Oscillating weight on a ball bearing (ETA). Thickness estimated.', 'eta-tc') },
  { id: 'rotor-pinion', arbor: 'rotor', mechanism: 'automatic', side: 'back', pos: at(center, H.automatic), explode: { dz: 20 }, material: 'steel', shape: { kind: 'pinion', leaves: A.rotorPinion, module: mAuto, length: 0.3 }, provenance: estimated(AUTO, 'eta-tc') },
  { id: 'reversing-wheel', arbor: 'reversing', mechanism: 'automatic', side: 'back', pos: at(reversing, H.automatic), explode: { dz: 18 }, material: 'gilt', shape: { kind: 'wheel', teeth: A.reversing, module: mAuto, thickness: 0.16, spokes: 0 }, provenance: estimated(AUTO, 'eta-tc', 'timezone-odets', 'monochrome') },
  { id: 'reversing-pinion', arbor: 'reversing-click', focus: 'reversing', mechanism: 'automatic', side: 'back', pos: at(reversing, H.automaticHigh), explode: { dz: 18 }, material: 'steel', shape: { kind: 'pinion', leaves: A.reversingPinion, module: mAuto, length: 0.25 }, provenance: estimated(AUTO, 'eta-tc', 'timezone-odets', 'monochrome') },
  { id: 'reduction-wheel', arbor: 'reduction', mechanism: 'automatic', side: 'back', pos: at(reduction, H.automaticHigh), explode: { dz: 18.5 }, material: 'gilt', shape: { kind: 'wheel', teeth: A.reduction, module: mAuto, thickness: 0.16, spokes: 0 }, provenance: estimated(AUTO, 'eta-tc') },
  { id: 'reduction-pinion', arbor: 'reduction', mechanism: 'automatic', side: 'back', pos: at(reduction, H.automatic), explode: { dz: 18.5 }, material: 'steel', shape: { kind: 'pinion', leaves: A.reductionPinion, module: mAuto, length: 0.25 }, provenance: estimated(AUTO, 'eta-tc') },
  { id: 'ratchet-driving-wheel', arbor: 'ratchet-drive', mechanism: 'automatic', side: 'back', pos: at(ratchetDrive, H.automatic), explode: { dz: 17 }, material: 'gilt', shape: { kind: 'wheel', teeth: A.ratchetDrive, module: mAuto, thickness: 0.16, spokes: 0 }, provenance: estimated(AUTO, 'eta-tc') },
  { id: 'ratchet-driving-pinion', arbor: 'ratchet-drive', mechanism: 'automatic', side: 'back', pos: at(ratchetDrive, H.ratchet), explode: { dz: 17 }, material: 'steel', shape: { kind: 'pinion', leaves: A.ratchetDrivePinion, module: mRatchet, length: 0.25 }, provenance: estimated(AUTO, 'eta-tc') },
  {
    id: 'automatic-bridge', mechanism: 'frame', side: 'back', pos: at(center, H.autoBridge), explode: { dz: 19 }, material: 'rhodium',
    shape: {
      kind: 'bridge', thickness: 0.2,
      lobes: [
        { ...reversing, r: 1.0 }, { ...reduction, r: 1.0 }, { ...ratchetDrive, r: 1.0 }, ...autoScrews.map((s) => ({ ...s, r: 0.85 })),
        ...chain(reversing, reduction, 0.8), ...chain(reduction, ratchetDrive, 0.8), ...chain(reversing, autoScrews[0]!, 0.8), ...chain(ratchetDrive, autoScrews[1]!, 0.8),
      ],
      blend: BLEND,
      jewels: [reversing, reduction, ratchetDrive],
      screws: autoScrews,
    },
    provenance: estimated('The automatic device bridge (ETA). Outline estimated.', 'eta-tc'),
  },
  // Keyless works
  { id: 'stem', focus: 'stem', axis: 'x', mechanism: 'keyless', side: 'dial', pos: { x: (stemIn + stemOut) / 2, y: 0, z: STEM_Z }, explode: { dz: -3 }, material: 'steel', shape: { kind: 'stem', radius: 0.45, length: stemOut - stemIn }, provenance: estimated(KEYLESS, 'eta-tc') },
  { id: 'winding-pinion', focus: 'stem', axis: 'x', mechanism: 'keyless', side: 'dial', pos: { x: 8.0, y: 0, z: STEM_Z }, explode: { dz: -3 }, material: 'steel', shape: { kind: 'wheel', teeth: 16, module: 0.1, thickness: 0.35, spokes: 0 }, provenance: estimated(KEYLESS, 'eta-tc') },
  { id: 'sliding-pinion', axis: 'x', mechanism: 'keyless', side: 'dial', pos: { x: 7.0, y: 0, z: STEM_Z }, explode: { dz: -3 }, material: 'steel', shape: { kind: 'wheel', teeth: 12, module: 0.1, thickness: 0.6, spokes: 0 }, provenance: estimated(KEYLESS, 'eta-tc') },
  { id: 'setting-wheel', mechanism: 'keyless', side: 'dial', pos: { x: 4.7, y: 1.4, z: H.motion }, explode: { dz: -1.2 }, material: 'steel', shape: { kind: 'wheel', teeth: 14, module: 0.1, thickness: 0.16, spokes: 0 }, provenance: estimated(KEYLESS, 'eta-tc') },
];

const caliber: Caliber = {
  id: 'valjoux-7750',
  name: 'Valjoux 7750',
  specs: {
    diameterMm: 30, heightMm: 7.9, jewels: 25, vph: 28800, powerReserveH: 48, hacking: true, quickDate: true,
    sourceIds: ['eta-tc', 'monochrome', 'timezone-odets'],
  },
  exterior: {
    frontZ: FRONT, secondsZ: HAND.chrono, dialZ: DIAL - DIAL_THICKNESS / 2,
    dateWindow: { width: 2.4, height: 2.0 },
    dayWindow: { width: 4.4, height: 2.0 },
    // At 2 and 4 o'clock, a little behind the stem (the Sinn 103's side photo), where the operating lever and the
    // hammer's lever reach the edge.
    pushers: [{ action: 'start-stop', hour: 2, z: STEM_Z + 0.35 }, { action: 'reset', hour: 4, z: STEM_Z + 0.35 }],
  },
  parts,
  couplings: [
    { type: 'mesh', a: 'barrel', b: 'great-pinion' },
    { type: 'mesh', a: 'great-wheel', b: 'third-pinion' },
    { type: 'mesh', a: 'third-wheel', b: 'fourth-pinion' },
    { type: 'mesh', a: 'fourth-wheel', b: 'escape-pinion' },
    { type: 'escapement', balance: 'balance-wheel', fork: 'pallet-fork', escapeWheel: 'escape-wheel' },
    { type: 'slip', a: 'great-wheel', b: 'driving-pinion' },
    { type: 'mesh', a: 'driving-pinion', b: 'minute-wheel' },
    { type: 'mesh', a: 'minute-wheel', b: 'cannon-pinion' },
    { type: 'mesh', a: 'minute-pinion', b: 'hour-wheel' },
    { type: 'mesh', a: 'hour-wheel', b: 'date-driver' },
    { type: 'mesh', a: 'hour-wheel', b: 'day-driver' },
    { type: 'intermittent', driver: 'date-driver', driven: 'date-ring' },
    { type: 'intermittent', driver: 'day-driver', driven: 'day-ring', calendar: 'day' },
    { type: 'mesh', a: 'fourth-wheel', b: 'oscillating-pinion-lower' },
    { type: 'mesh', a: 'minute-counting-wheel', b: 'minute-intermediate-wheel' },
    {
      type: 'chronograph', cam: 'cam', pinion: 'oscillating-pinion', runner: 'chronograph-wheel', swing: 0.25,
      minutes: { wheel: 'minute-counting-wheel' }, hours: { driver: 'barrel-hour-pinion', wheel: 'hour-counting-wheel' },
      hearts: ['runner-heart', 'minute-heart', 'hour-heart'], hammers: ['hammer', 'hour-hammer'], stroke: 0.35,
    },
    { type: 'mesh', a: 'rotor-pinion', b: 'reversing-wheel' },
    // Clockwise, seen from the back, the rotor turns the reversing wheel the + way: only then does its click take hold.
    { type: 'click', input: 'reversing-wheel', output: 'reversing-pinion', direction: 1 },
    { type: 'mesh', a: 'reversing-pinion', b: 'reduction-wheel' },
    { type: 'mesh', a: 'reduction-pinion', b: 'ratchet-driving-wheel' },
    { type: 'mesh', a: 'ratchet-driving-pinion', b: 'ratchet' },
    { type: 'keyless', stem: 'stem', slidingPinion: 'sliding-pinion', windingPinion: 'winding-pinion', settingWheel: 'setting-wheel', pull: 0.7 },
  ],
  chapters: [
    { id: 'time', flow: ['barrel', 'great', 'third', 'fourth', 'escape', 'fork', 'balance'] },
    { id: 'hands', flow: [] },
    { id: 'date', flow: [] },
    { id: 'chrono', flow: ['fourth', 'oscillating-pinion', 'runner', 'minute-counter'] },
    { id: 'auto', flow: [] },
    { id: 'crown', flow: [] },
  ],
  tour: [
    { id: 'time-overview', chapter: 'time', focus: null, side: 'back', speed: 0.1, xray: false, rotor: 'hide', cameraOffset: [-22, 34, 38], stats: [{ label: 'jewels', value: '25' }, { label: 'vph', value: '28,800' }] },
    { id: 'time-barrel', chapter: 'time', focus: 'barrel', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-14, 22, 24], stats: [{ label: 'teeth', value: '90' }, { label: 'powerReserve', value: '48 h' }] },
    { id: 'time-great', chapter: 'time', focus: 'great', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-12, 20, 22], stats: [{ label: 'teeth', value: '80' }, { label: 'rotation', value: '1 rph' }] },
    { id: 'time-third', chapter: 'time', focus: 'third', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-10, 18, 20], stats: [{ label: 'teeth', value: '75' }, { label: 'leaves', value: '10' }] },
    { id: 'time-fourth', chapter: 'time', focus: 'fourth', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-10, 17, 19], stats: [{ label: 'teeth', value: '84' }, { label: 'rotation', value: '1 rpm' }] },
    { id: 'time-escape', chapter: 'time', focus: 'escape', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-7, 12, 14], stats: [{ label: 'teeth', value: '20' }, { label: 'rotation', value: '12 rpm' }] },
    { id: 'time-fork', chapter: 'time', focus: 'fork', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-7, 12, 14], stats: [{ label: 'pallets', value: '2' }, { label: 'lift', value: '49°' }] },
    { id: 'time-balance', chapter: 'time', focus: 'balance', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-12, 19, 21], stats: [{ label: 'vph', value: '28,800' }, { label: 'frequency', value: '4 Hz' }] },
    { id: 'hands-overview', chapter: 'hands', focus: null, side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-16, 30, 32], stats: [{ label: 'ratio', value: '12 : 1' }, { label: 'wheels', value: '4' }] },
    { id: 'hands-cannon', chapter: 'hands', focus: 'cannon', side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-9, 16, 17], stats: [{ label: 'teeth', value: '12 / 12' }, { label: 'rotation', value: '1 rph' }] },
    { id: 'hands-minute-wheel', chapter: 'hands', focus: 'minute-wheel', side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-9, 16, 17], stats: [{ label: 'teeth', value: '36 / 10' }, { label: 'reduction', value: '1 : 3' }] },
    { id: 'hands-hour', chapter: 'hands', focus: 'hour', side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-10, 17, 18], stats: [{ label: 'teeth', value: '40' }, { label: 'rotation', value: '12 h' }] },
    { id: 'date-driver', chapter: 'date', focus: 'date-driver', side: 'dial', speed: 6000, xray: false, rotor: 'hide', cameraOffset: [-12, 20, 22], stats: [{ label: 'teeth', value: '80' }, { label: 'rotation', value: '24 h' }] },
    { id: 'date-ring', chapter: 'date', focus: 'date-ring', side: 'dial', speed: 6000, xray: false, rotor: 'hide', cameraOffset: [-14, 26, 28], stats: [{ label: 'teeth', value: '31' }, { label: 'step', value: '1 / day' }] },
    { id: 'date-day-ring', chapter: 'date', focus: 'day-ring', side: 'dial', speed: 6000, xray: false, rotor: 'hide', cameraOffset: [-12, 22, 24], stats: [{ label: 'teeth', value: '14' }, { label: 'step', value: '1 / day' }] },
    { id: 'chrono-overview', chapter: 'chrono', focus: null, side: 'back', speed: 1, xray: true, rotor: 'hide', ctl: 'chrono', cameraOffset: [-18, 30, 34], stats: [{ label: 'chrono', value: 'live:chrono' }, { label: 'counters', value: '30 min · 12 h' }] },
    { id: 'chrono-cam', chapter: 'chrono', focus: 'cam', side: 'back', speed: 1, xray: true, rotor: 'hide', ctl: 'chrono', cameraOffset: [-8, 15, 16], stats: [{ label: 'chrono', value: 'live:chrono' }, { label: 'teeth', value: '8' }] },
    { id: 'chrono-pinion', chapter: 'chrono', focus: 'oscillating-pinion', side: 'back', speed: 1, xray: true, rotor: 'hide', ctl: 'chrono', cameraOffset: [-8, 14, 15], stats: [{ label: 'chrono', value: 'live:chrono' }, { label: 'leaves', value: '10 / 10' }] },
    { id: 'chrono-runner', chapter: 'chrono', focus: 'runner', side: 'back', speed: 1, xray: true, rotor: 'hide', ctl: 'chrono', cameraOffset: [-12, 21, 23], stats: [{ label: 'chrono', value: 'live:chrono' }, { label: 'rotation', value: '1 rpm' }] },
    { id: 'chrono-minute-counter', chapter: 'chrono', focus: 'minute-counter', side: 'back', speed: 20, xray: true, rotor: 'hide', ctl: 'chrono', cameraOffset: [-9, 16, 17], stats: [{ label: 'chrono', value: 'live:chrono' }, { label: 'teeth', value: '30' }] },
    { id: 'chrono-hour-counter', chapter: 'chrono', focus: 'hour-counter', side: 'dial', speed: 600, xray: false, rotor: 'hide', ctl: 'chrono', cameraOffset: [-10, 18, 19], stats: [{ label: 'chrono', value: 'live:chrono' }, { label: 'rotation', value: '12 h' }] },
    { id: 'chrono-hammer', chapter: 'chrono', focus: 'hammer', side: 'back', speed: 1, xray: true, rotor: 'hide', ctl: 'chrono', cameraOffset: [-10, 18, 20], stats: [{ label: 'chrono', value: 'live:chrono' }, { label: 'hearts', value: '3' }] },
    { id: 'auto-rotor', chapter: 'auto', focus: 'rotor', side: 'back', speed: 0.1, xray: false, rotor: 'show', cameraOffset: [-18, 30, 32], stats: [{ label: 'direction', value: '⟳' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'auto-reversing', chapter: 'auto', focus: 'reversing', side: 'back', speed: 0.1, xray: true, rotor: 'xray', cameraOffset: [-11, 20, 22], stats: [{ label: 'system', value: 'click' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'auto-reduction', chapter: 'auto', focus: 'reduction', side: 'back', speed: 0.1, xray: true, rotor: 'xray', cameraOffset: [-11, 20, 22], stats: [{ label: 'teeth', value: '40 / 10' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'auto-ratchet-drive', chapter: 'auto', focus: 'ratchet-drive', side: 'back', speed: 0.1, xray: true, rotor: 'xray', cameraOffset: [-11, 20, 22], stats: [{ label: 'teeth', value: '40 / 10' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'auto-ratchet', chapter: 'auto', focus: 'ratchet', side: 'back', speed: 0.1, xray: true, rotor: 'xray', cameraOffset: [-13, 24, 26], stats: [{ label: 'teeth', value: '60' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'crown-stem', chapter: 'crown', focus: 'stem', side: 'dial', speed: 0.1, xray: false, rotor: 'hide', ctl: 'crown', cameraOffset: [-10, 20, 22], stats: [{ label: 'position', value: 'live:crown' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'crown-sliding', chapter: 'crown', focus: 'sliding-pinion', side: 'dial', speed: 0.1, xray: false, rotor: 'hide', ctl: 'crown', cameraOffset: [-8, 15, 16], stats: [{ label: 'position', value: 'live:crown' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'crown-hacking', chapter: 'crown', focus: 'balance', side: 'back', speed: 1, xray: false, rotor: 'hide', ctl: 'crown', cameraOffset: [-12, 19, 21], stats: [{ label: 'position', value: 'live:crown' }, { label: 'vph', value: '28,800' }] },
  ],
  sources: [
    { id: 'eta-tc', title: 'ETA 7750 Technical Communication (specifications and parts list)', url: 'https://www.manualslib.com/manual/2052545/Eta-7750.html' },
    { id: 'monochrome', title: 'Everything you should know about the Valjoux 7750 — Monochrome', url: 'https://monochrome-watches.com/valjoux-7750-chronograph-history-50-years-technical-explanation-evolution-clones-in-depth-review/' },
    { id: 'timezone-odets', title: 'The Valjoux 7750 Chronograph, part 1 — Walt Odets, TimeZone', url: 'https://www.timezone.com/2002/09/16/the-valjoux-7750-chronograph-part-1/' },
    { id: 'revolution-pinion', title: 'Oscillating pinion: the unsung chronograph coupling — Revolution', url: 'https://revolutionwatch.com/oscillating-pinion-the-unsung-chronograph-coupling-solution/' },
    { id: 'timezone-hours', title: 'Valjoux 7750 hour counter keeps advancing — TimeZone forum', url: 'http://forums.timezone.com/index.php?t=msg&th=2413291' },
    { id: 'bobinchak-calendar', title: '7750: calendar synchronization — Nathan Bobinchak', url: 'http://www.bobinchak.com/watchmaking/2018/3/18/7750-calendar-synchronization' },
    { id: 'commons-7750', title: 'Valjoux 7750, rotor side — Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Valjoux7750.JPG' },
    { id: 'gleave-day-disc', title: 'Day disc at 3 o\'clock, ETA 7750 (2561/1) — Gleave & Co.', url: 'https://gleave.london/day-disc-at-3-oclock-eta-7750-2561-1/' },
  ],
};

export default caliber;
