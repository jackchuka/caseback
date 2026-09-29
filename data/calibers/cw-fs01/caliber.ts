import type { Caliber, Part } from '../../../src/model/schema';
import { at, centerDistance, circleIntersection, offset, place, type P2 } from '../../../src/kinematics/gearMath';
import { BLEND, chain, escapementRests, estimated, pinSpanner, sourced } from '../kit';

const LAYOUT = 'The SW200-1 copies the ETA 2824-2; positions and modules are chosen to fit its 25.6 mm, not measured.';
const TRAIN = 'Tooth count as the ETA 2824-2, whose part numbers the SW200-1 shares; Sellita does not publish counts.';
const MODULE = 'Placed after Christopher Ward\'s CAD render of the FS01 and the Azzurro front photo; Christopher Ward publishes no FS01 dimensions or tooth counts.';
const SNAIL = 'Sources differ on the snail\'s arbor (minute wheel: Kaminsky; cannon pinion: SJX, and the JJ01 it grew from). It must turn once an hour to drop on each hour, so it rides the minute arbor here.';
const HAMMER = 'The hammer and its spring are named by Christopher Ward and Deployant; its length, pivot and swing are estimates.';
const GONG = 'Christopher Ward: a mirror-polished steel spring round the dial, doubled back on itself (Fratello says titanium). Radii from the Azzurro front photo, estimated.';
const SILENCE = 'Deployant: a column wheel, turned by the pusher at 4, sets a lever that lifts the hammer away from the gong. Tooth count and sizes are estimates.';

// The base sits turned in the case so its stem points at the crown, 25.3° above 3 o'clock (photo:front, Azzurro).
const BASE_TURN = (-25.3 * Math.PI) / 180;
const turn = (p: P2): P2 => ({ x: p.x * Math.cos(BASE_TURN) - p.y * Math.sin(BASE_TURN), y: p.x * Math.sin(BASE_TURN) + p.y * Math.cos(BASE_TURN) });

// SW200-1 going train and self-winding, laid out as the 2824-2's, then turned.
const Z = { barrel: 84, centerPinion: 12, center: 80, thirdPinion: 10, third: 75, fourthPinion: 10, fourth: 84, escapePinion: 7, escape: 20 };
const M = { barrel: 0.11, center: 0.085, third: 0.075, fourth: 0.06 };
const center: P2 = { x: 0, y: 0 };
const raw = (() => {
  const barrel = place(center, centerDistance(M.barrel, Z.barrel, Z.centerPinion), 90);
  const third = place(center, centerDistance(M.center, Z.center, Z.thirdPinion), -130);
  const fourth = place(third, centerDistance(M.third, Z.third, Z.fourthPinion), -50);
  const escape = place(fourth, centerDistance(M.fourth, Z.fourth, Z.escapePinion), -15);
  const fork = place(escape, 2.05, 30);
  const balance = place(fork, 3.9, 30);
  return { barrel, third, fourth, escape, fork, balance };
})();
const barrel = turn(raw.barrel), third = turn(raw.third), fourth = turn(raw.fourth), escape = turn(raw.escape), fork = turn(raw.fork), balance = turn(raw.balance);
const MW = { cannon: 12, minuteWheel: 36 };
const mMotion = 0.1;
const minuteWheel = turn(place(center, centerDistance(mMotion, MW.cannon, MW.minuteWheel), -20));
const A = { rotorPinion: 12, revA: 18, revB: 14, redWheel: 22, redPinion: 9, ratchet: 50 };
const mAuto = 0.1;
const mRatchet = 0.12;
const revA = turn(place(center, centerDistance(mAuto, A.rotorPinion, A.revA), 20));
const revB = turn(place(place(center, centerDistance(mAuto, A.rotorPinion, A.revA), 20), centerDistance(mAuto, A.revA, A.revB), 60));
const reduction = circleIntersection(revB, centerDistance(mAuto, A.revB, A.redWheel), barrel, centerDistance(mRatchet, A.redPinion, A.ratchet), -1);
const AUTO = 'Self-winding as the ETA 2824-2 it copies; layout and tooth counts are illustrative.';
const K = { sliding: 12, winding: 16, setting: 14 };
const KEYLESS = 'Keyless works as the ETA 2824-2; not modelled to scale.';
const STEM_Z = -1.5;
const stemIn = 4.4;
const stemOut = 12.8 + 3.3;
const alongStem = (d: number) => turn({ x: d, y: 0 });

// Back-side heights as the 2824-2's (4.60 mm plate to rotor, Sellita).
const PLATE_BACK = -0.05;
const SQUEEZE = 0.722;
const back = (old: number) => Math.round((PLATE_BACK + (old - PLATE_BACK) * SQUEEZE) * 1000) / 1000;
const H = {
  barrel: back(0.6), centerPinion: back(0.75), centerWheel: back(1.25), thirdPinion: back(1.25), thirdWheel: back(1.85),
  fourthPinion: back(1.85), fourthWheel: back(2.35), escapePinion: back(2.35), escapeWheel: back(1.9), palletFork: back(1.9),
  balance: back(2.0), hairspring: back(2.55), balanceCock: back(3.1), trainBridge: back(3.2), barrelBridge: back(3.4),
  ratchet: back(3.95), reductionPinion: back(3.95), automatic: back(4.1), rotor: back(4.1) + 0.435,
};
const pinSpan = pinSpanner(PLATE_BACK, 0.55);
const { forkRest, balanceRest } = escapementRests(escape, fork, balance);
const cockBase = turn({ x: raw.balance.x + 2.8, y: raw.balance.y + 3.4 });

// FS01 heights, dial side (−Z toward the viewer). The module plate is the watch's dial, its face at DIAL.
const DIAL = -2.6;
const D = {
  snail: -2.05, trainWheels: -2.85, strike: -2.9, gong: -2.95, cocks: -3.3,
  subCannon: -3.1, subHour: -3.3, subBridge: -3.65, hourHand: -4.25, minuteHand: -4.45,
};

// The time display at 12: a wheel on the minute arbor drives, through an intermediate wheel, an equal wheel on the
// sub-dial's arbor, which turns with it once an hour and carries a 1:12 motion works of its own. The sub-dial's arbor
// stands 9.15 mm above the centre and the intermediate wheel halfway (photo:front, Azzurro); the module is what puts
// them there, and the centre and intermediate wheels' sizes are the photo's (tips 1.95 and 2.8 mm).
const T = { center: 40, intermediate: 60, subCenter: 40, subCannon: 12, subMinuteWheel: 36, subMinutePinion: 10, subHourWheel: 40 };
const SUB_ABOVE = 9.15; // photo:front (Azzurro)
const mTime = (2 * SUB_ABOVE) / (T.center + 2 * T.intermediate + T.subCenter);
const mSub = 0.1;
const mSubHour = 0.096;
const intermediate = place(center, centerDistance(mTime, T.center, T.intermediate), -90);
const SUB = place(intermediate, centerDistance(mTime, T.intermediate, T.subCenter), -90);
const subMinuteWheel = place(SUB, centerDistance(mSub, T.subCannon, T.subMinuteWheel), -30);

// Strike works, from the CAD render and the front photo (mm, 12 o'clock −Y). Pivots sit at the photo's jewels.
const hammerPivot: P2 = { x: -7.85, y: 7.5 }; // photo:front (Azzurro)
const leverPivot: P2 = { x: 5.95, y: 3.45 }; // photo:front (Azzurro)
const columnWheel: P2 = { x: 10.05, y: 2.55 }; // photo:front (Azzurro)
const switchPivot: P2 = { x: 6.45, y: 1.25 }; // photo:front (Azzurro): the pin by the lever's nose
const indicatorPivot: P2 = { x: 7.55, y: 7.6 }; // photo:front (Azzurro)
// photo:front (Azzurro): silenced, the indicator turns from the printed wave down to the printed line, 40° on.
const INDICATOR_TURN = (40 * Math.PI) / 180;
// photo:front (Azzurro): both wires fitted as circles, within 0.1 mm, round one centre just off the dial's.
const GONG_CENTER: P2 = { x: -0.18, y: -0.04 };
const deg = (d: number) => (d * Math.PI) / 180;
// Outlines drawn in movement coordinates, carried into each lever's own frame (pivot at the origin).
const local = (pivot: P2, pts: Array<[number, number]>) => pts.map(([x, y]) => ({ x: x - pivot.x, y: y - pivot.y }));

// The gong (photo:front, Azzurro): wires 0.62 wide at 15.32 and 16.8 mm, the hairpin at −41.5°, the outer wire's
// free end at 186°.
const GONG_SHAPE = { outer: 16.8, inner: 15.32, from: deg(-41.5), to: deg(186), width: 0.62, thickness: 0.5 };
// The hammer (photo:front, Azzurro): a wide blade reaching up toward 8 o'clock, its corner just inside the gong's
// inner wire, and a short tail toward the centre.
const HAMMER_OUTLINE: Array<[number, number]> = [
  [-14.66, 2.86], [-11.06, 1.34], [-10.2, 3.6], [-8.95, 6.25], [-7.3, 6.6], [-5.95, 5.2], [-5.35, 5.4], [-5.5, 6.0],
  [-6.8, 7.3], [-7.6, 8.55], [-8.6, 8.45], [-9.3, 7.95], [-12.0, 5.7],
];
// The swing that lands the blade's corner on the inner wire's inner face: counter-clockwise, so negative. Found by
// bisection on the farthest the turned outline reaches from the gong's centre.
const hammerSwing = (() => {
  const face = GONG_SHAPE.inner - GONG_SHAPE.width / 2;
  const reach = (a: number) => Math.max(...HAMMER_OUTLINE.map(([x, y]) => {
    const [dx, dy] = [x - hammerPivot.x, y - hammerPivot.y];
    return Math.hypot(hammerPivot.x + dx * Math.cos(a) - dy * Math.sin(a) - GONG_CENTER.x, hammerPivot.y + dx * Math.sin(a) + dy * Math.cos(a) - GONG_CENTER.y);
  }));
  let [lo, hi] = [-0.3, 0];
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (reach(mid) > face) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();
// The snail (photo:front, Azzurro): read through the keyhole below the centre by the strike lever's tip, which rests
// on its high point, so its step faces the tip on the hour; the lever follows the rim's fall over the hour.
const SNAIL_RIM = { rMin: 1.6, rMax: 2.8 };
const LEVER_TIP: P2 = { x: -0.55, y: 2.75 };
const snailRest = Math.atan2(LEVER_TIP.y, LEVER_TIP.x);
const leverLift = (SNAIL_RIM.rMax - SNAIL_RIM.rMin) / Math.hypot(LEVER_TIP.x - leverPivot.x, LEVER_TIP.y - leverPivot.y);

// The sub-dial bridge's arch (photo:front, Azzurro): at each end, below 9 and 3, a pointed block round its screw;
// from it a slim arm rises under the chapter ring to a boss round the sub-dial's jewel. ARCH lists the pairs of lobes
// its arms web together.
const ARCH_LEFT: P2[] = [{ x: -13.9, y: -3.0 }, { x: -12.6, y: -6.8 }, { x: -11.5, y: -6.4 }, { x: -9.1, y: -6.3 }, { x: -9.3, y: -8.8 }, { x: -7.0, y: -9.45 }, { x: -4.4, y: -9.8 }, { x: -2.1, y: -9.7 }];
const ARCH_RIGHT: P2[] = ARCH_LEFT.map((p) => ({ x: -p.x, y: p.y }));
const ARCH: Array<[P2, P2]> = [ARCH_LEFT, ARCH_RIGHT].flatMap((side) => [...side, SUB].slice(0, -1).map((p, i): [P2, P2] => [p, [...side, SUB][i + 1]!]));
const ARCH_R = [0.6, 0.8, 1.35, 0.65, 0.7, 0.45, 0.45, 0.5];
// Discs every 0.4 mm from a to b: a slimmer web than `chain`'s, for the arch's arms.
const rod = (a: P2, b: P2, r: number) => {
  const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 0.4));
  return Array.from({ length: n - 1 }, (_, i) => ({ x: a.x + ((b.x - a.x) * (i + 1)) / n, y: a.y + ((b.y - a.y) * (i + 1)) / n, r }));
};
// The songbird's wings (photo:front, Azzurro): chevron cocks from a jewel down to the V at 6, screwed near its foot;
// `side` −1 for the left wing, 1 for the right.
const wing = (jewel: P2, side: -1 | 1) => {
  const pts: Array<P2 & { r: number }> = [{ ...jewel, r: 1.15 }, { x: side * 4.65, y: 9.6, r: 1.25 }, { x: side * 1.85, y: 11.45, r: 1.3 }, { x: side * 1.65, y: 13.1, r: 1.05 }];
  return [...pts, ...pts.slice(1).flatMap((p, i) => chain(pts[i]!, p, 0.9))];
};

const parts: Part[] = [
  { id: 'plate', mechanism: 'frame', side: 'back', pos: at(center, -0.6), explode: { dz: -0.5 }, material: 'plate', shape: { kind: 'plate', radius: 12.8, thickness: 1.1 }, provenance: sourced('sellita-doctec') },
  { id: 'barrel', arbor: 'barrel', mechanism: 'power', side: 'back', pos: at(barrel, H.barrel), explode: { dz: 3.2 }, material: 'gilt', shape: { kind: 'barrel', teeth: Z.barrel, module: M.barrel, thickness: 0.35, drumHeight: 1.3 }, provenance: estimated(TRAIN) },
  { id: 'ratchet', mechanism: 'power', side: 'back', pos: at(barrel, H.ratchet), explode: { dz: 12.5 }, material: 'steel', shape: { kind: 'ratchet', teeth: A.ratchet, module: mRatchet, thickness: 0.28 }, provenance: estimated(LAYOUT) },
  { id: 'center-pinion', arbor: 'center', mechanism: 'going-train', side: 'back', pos: at(center, H.centerPinion), explode: { dz: 4.4 }, material: 'steel', shape: { kind: 'pinion', leaves: Z.centerPinion, module: M.barrel, length: 0.9 }, provenance: estimated(TRAIN) },
  { id: 'center-wheel', arbor: 'center', mechanism: 'going-train', side: 'back', pos: at(center, H.centerWheel), explode: { dz: 4.4 }, material: 'gilt', shape: { kind: 'wheel', teeth: Z.center, module: M.center, thickness: 0.28, spokes: 4, pin: pinSpan(H.centerWheel, H.trainBridge) }, provenance: estimated(TRAIN) },
  { id: 'third-pinion', arbor: 'third', mechanism: 'going-train', side: 'back', pos: at(third, H.thirdPinion), explode: { dz: 5.2 }, material: 'steel', shape: { kind: 'pinion', leaves: Z.thirdPinion, module: M.center, length: 0.9 }, provenance: estimated(TRAIN) },
  { id: 'third-wheel', arbor: 'third', mechanism: 'going-train', side: 'back', pos: at(third, H.thirdWheel), explode: { dz: 5.2 }, material: 'gilt', shape: { kind: 'wheel', teeth: Z.third, module: M.third, thickness: 0.24, spokes: 5, pin: pinSpan(H.thirdWheel, H.trainBridge) }, provenance: estimated(TRAIN) },
  { id: 'fourth-pinion', arbor: 'fourth', mechanism: 'going-train', side: 'back', pos: at(fourth, H.fourthPinion), explode: { dz: 6.0 }, material: 'steel', shape: { kind: 'pinion', leaves: Z.fourthPinion, module: M.third, length: 0.9 }, provenance: estimated(TRAIN) },
  { id: 'fourth-wheel', arbor: 'fourth', mechanism: 'going-train', side: 'back', pos: at(fourth, H.fourthWheel), explode: { dz: 6.0 }, material: 'gilt', shape: { kind: 'wheel', teeth: Z.fourth, module: M.fourth, thickness: 0.22, spokes: 5, pin: pinSpan(H.fourthWheel, H.trainBridge) }, provenance: estimated('84 teeth derived from 28,800 vph with a 20-tooth escape wheel and a 7-leaf pinion.') },
  { id: 'escape-pinion', arbor: 'escape', mechanism: 'escapement', side: 'back', pos: at(escape, H.escapePinion), explode: { dz: 6.8 }, material: 'steel', shape: { kind: 'pinion', leaves: Z.escapePinion, module: M.fourth, length: 0.8 }, provenance: estimated(TRAIN) },
  { id: 'escape-wheel', arbor: 'escape', mechanism: 'escapement', side: 'back', pos: at(escape, H.escapeWheel), explode: { dz: 6.8 }, material: 'steel', shape: { kind: 'escape-wheel', teeth: Z.escape, outerRadius: 1.45, thickness: 0.16 }, provenance: estimated(TRAIN) },
  { id: 'pallet-fork', arbor: 'fork', rest: forkRest, mechanism: 'escapement', side: 'back', pos: at(fork, H.palletFork), explode: { dz: 7.4 }, material: 'steel', shape: { kind: 'pallet-fork', span: 2.6, length: 3.0, thickness: 0.14 }, provenance: estimated(LAYOUT) },
  { id: 'balance-wheel', arbor: 'balance', rest: balanceRest, mechanism: 'regulator', side: 'back', pos: at(balance, H.balance), explode: { dz: 9.0 }, material: 'balance', shape: { kind: 'balance', radius: 4.1, rimThickness: 0.22, arms: 2, pin: pinSpan(H.balance, H.balanceCock) }, provenance: estimated(LAYOUT) },
  { id: 'hairspring', arbor: 'balance', mechanism: 'regulator', side: 'back', pos: at(balance, H.hairspring), explode: { dz: 9.0 }, material: 'steel', shape: { kind: 'hairspring', turns: 12, innerRadius: 0.55, pitch: 0.2 }, provenance: estimated(LAYOUT) },
  {
    id: 'train-bridge', mechanism: 'frame', side: 'back', pos: at(center, H.trainBridge), explode: { dz: 11 }, material: 'rhodium',
    shape: {
      kind: 'bridge', thickness: 0.55,
      lobes: [{ ...center, r: 1.4 }, { ...third, r: 1.3 }, { ...fourth, r: 1.3 }, { ...escape, r: 1.1 }, { ...turn(offset(raw.third, 1.9, 1.2)), r: 0.9 }, { ...turn({ x: -1.7, y: -1.4 }), r: 0.9 }],
      jewels: [center, third, fourth, escape],
      screws: [turn(offset(raw.third, 1.9, 1.2)), turn({ x: -1.7, y: -1.4 })],
    },
    provenance: estimated(LAYOUT),
  },
  {
    id: 'barrel-bridge', mechanism: 'frame', side: 'back', pos: at(center, H.barrelBridge), explode: { dz: 9.5 }, material: 'rhodium',
    shape: {
      kind: 'bridge', thickness: 0.55,
      lobes: [{ ...barrel, r: 4.6 }, { ...turn(offset(raw.barrel, -3.2, 2.6)), r: 0.9 }, { ...turn(offset(raw.barrel, 3.5, -3.6)), r: 0.9 }],
      // Sellita jewels the barrel bridge (the SW200-1's 26th jewel, where ETA has a plain bearing).
      jewels: [barrel],
      screws: [turn(offset(raw.barrel, -3.2, 2.6)), turn(offset(raw.barrel, 3.5, -3.6))],
    },
    provenance: estimated(LAYOUT, 'sellita-doctec'),
  },
  {
    id: 'balance-cock', mechanism: 'frame', side: 'back', pos: at(center, H.balanceCock), explode: { dz: 13 }, material: 'rhodium',
    shape: { kind: 'bridge', thickness: 0.55, lobes: [{ ...balance, r: 1.0 }, { x: (balance.x + cockBase.x) / 2, y: (balance.y + cockBase.y) / 2, r: 0.8 }, { ...cockBase, r: 1.3 }], jewels: [balance], screws: [cockBase] },
    provenance: estimated(LAYOUT),
  },
  { id: 'rotor', arbor: 'rotor', mechanism: 'automatic', side: 'back', pos: at(center, H.rotor), explode: { dz: 18 }, material: 'gilt', shape: { kind: 'rotor', radius: 12.5, hub: 1.2, thickness: 0.45 }, provenance: estimated(AUTO) },
  { id: 'rotor-pinion', arbor: 'rotor', mechanism: 'automatic', side: 'back', pos: at(center, H.automatic), explode: { dz: 18 }, material: 'steel', shape: { kind: 'pinion', leaves: A.rotorPinion, module: mAuto, length: 0.5 }, provenance: estimated(AUTO) },
  { id: 'reverser-a', focus: 'reversers', mechanism: 'automatic', side: 'back', pos: at(revA, H.automatic), explode: { dz: 15 }, material: 'gilt', shape: { kind: 'wheel', teeth: A.revA, module: mAuto, thickness: 0.16, spokes: 0 }, provenance: estimated(AUTO) },
  { id: 'reverser-b', focus: 'reversers', mechanism: 'automatic', side: 'back', pos: at(revB, H.automatic), explode: { dz: 15 }, material: 'gilt', shape: { kind: 'wheel', teeth: A.revB, module: mAuto, thickness: 0.16, spokes: 0 }, provenance: estimated(AUTO) },
  { id: 'reduction-wheel', arbor: 'reduction', mechanism: 'automatic', side: 'back', pos: at(reduction, H.automatic), explode: { dz: 16 }, material: 'gilt', shape: { kind: 'wheel', teeth: A.redWheel, module: mAuto, thickness: 0.16, spokes: 0 }, provenance: estimated(AUTO) },
  { id: 'reduction-pinion', arbor: 'reduction', mechanism: 'automatic', side: 'back', pos: at(reduction, H.reductionPinion), explode: { dz: 16 }, material: 'steel', shape: { kind: 'pinion', leaves: A.redPinion, module: mRatchet, length: 0.4 }, provenance: estimated(AUTO) },
  { id: 'stem', focus: 'stem', axis: 'x', yaw: BASE_TURN, mechanism: 'keyless', side: 'dial', pos: { ...alongStem((stemIn + stemOut) / 2), z: STEM_Z }, explode: { dz: -2 }, material: 'steel', shape: { kind: 'stem', radius: 0.26, length: stemOut - stemIn }, provenance: estimated(KEYLESS) },
  { id: 'winding-pinion', focus: 'stem', axis: 'x', yaw: BASE_TURN, mechanism: 'keyless', side: 'dial', pos: { ...alongStem(7.1), z: STEM_Z }, explode: { dz: -2 }, material: 'steel', shape: { kind: 'wheel', teeth: K.winding, module: 0.1, thickness: 0.35, spokes: 0 }, provenance: estimated(KEYLESS) },
  { id: 'sliding-pinion', axis: 'x', yaw: BASE_TURN, mechanism: 'keyless', side: 'dial', pos: { ...alongStem(6.25), z: STEM_Z }, explode: { dz: -2 }, material: 'steel', shape: { kind: 'wheel', teeth: K.sliding, module: 0.1, thickness: 0.6, spokes: 0 }, provenance: estimated(KEYLESS) },
  { id: 'setting-wheel', mechanism: 'keyless', side: 'dial', pos: at(turn({ x: 5.0, y: -1.25 }), -1.6), explode: { dz: -1.2 }, material: 'steel', shape: { kind: 'wheel', teeth: K.setting, module: 0.1, thickness: 0.18, spokes: 0 }, provenance: estimated(KEYLESS) },
  // The base's motion works keep only the cannon pinion and minute wheel: the hours are told on the sub-dial.
  { id: 'cannon-pinion', arbor: 'cannon', mechanism: 'motion-works', side: 'dial', pos: at(center, -1.6), explode: { dz: -2.4 }, material: 'steel', shape: { kind: 'pinion', leaves: MW.cannon, module: mMotion, length: 0.8 }, provenance: estimated(TRAIN) },
  { id: 'minute-wheel', arbor: 'minute-wheel', mechanism: 'motion-works', side: 'dial', pos: at(minuteWheel, -1.6), explode: { dz: -3.2 }, material: 'gilt', shape: { kind: 'wheel', teeth: MW.minuteWheel, module: mMotion, thickness: 0.18, spokes: 0 }, provenance: estimated(TRAIN) },
  { id: 'snail', arbor: 'cannon', focus: 'snail', mechanism: 'strike', side: 'dial', pos: at(center, D.snail), rest: snailRest, explode: { dz: -2.8 }, material: 'steel', shape: { kind: 'snail', ...SNAIL_RIM, thickness: 0.25 }, provenance: estimated(SNAIL, 'deployant', 'sjx', 'kaminsky') },
  // FS01 time display.
  { id: 'module-center-wheel', arbor: 'cannon', mechanism: 'motion-works', side: 'dial', pos: at(center, D.trainWheels), explode: { dz: -4 }, material: 'rhodium', shape: { kind: 'wheel', teeth: T.center, module: mTime, thickness: 0.2, spokes: 0 }, provenance: estimated(MODULE, 'watchfinder') },
  { id: 'intermediate-wheel', mechanism: 'motion-works', side: 'dial', pos: at(intermediate, D.trainWheels), explode: { dz: -4 }, material: 'rhodium', shape: { kind: 'wheel', teeth: T.intermediate, module: mTime, thickness: 0.2, spokes: 4 }, provenance: estimated(MODULE, 'watchfinder') },
  { id: 'sub-center-wheel', arbor: 'sub-minute', mechanism: 'motion-works', side: 'dial', pos: at(SUB, D.trainWheels), explode: { dz: -4 }, material: 'rhodium', shape: { kind: 'wheel', teeth: T.subCenter, module: mTime, thickness: 0.2, spokes: 0 }, provenance: estimated(MODULE) },
  { id: 'sub-cannon-pinion', arbor: 'sub-minute', mechanism: 'motion-works', side: 'dial', pos: at(SUB, D.subCannon), explode: { dz: -5.5 }, material: 'steel', shape: { kind: 'pinion', leaves: T.subCannon, module: mSub, length: 0.6 }, provenance: estimated(MODULE) },
  { id: 'sub-minute-wheel', arbor: 'sub-minute-wheel', mechanism: 'motion-works', side: 'dial', pos: at(subMinuteWheel, D.subCannon), explode: { dz: -5.5 }, material: 'rhodium', shape: { kind: 'wheel', teeth: T.subMinuteWheel, module: mSub, thickness: 0.18, spokes: 0 }, provenance: estimated(MODULE) },
  { id: 'sub-minute-pinion', arbor: 'sub-minute-wheel', mechanism: 'motion-works', side: 'dial', pos: at(subMinuteWheel, D.subHour), explode: { dz: -5.5 }, material: 'steel', shape: { kind: 'pinion', leaves: T.subMinutePinion, module: mSubHour, length: 0.5 }, provenance: estimated(MODULE) },
  { id: 'sub-hour-wheel', arbor: 'sub-hour', mechanism: 'motion-works', side: 'dial', pos: at(SUB, D.subHour), explode: { dz: -6 }, material: 'rhodium', shape: { kind: 'wheel', teeth: T.subHourWheel, module: mSubHour, thickness: 0.16, spokes: 5 }, provenance: estimated(MODULE) },
  { id: 'hour-hand', arbor: 'sub-hour', mechanism: 'motion-works', side: 'dial', pos: at(SUB, D.hourHand), explode: { dz: -9 }, material: 'steel', shape: { kind: 'hand', length: 5.6, width: 0.5, thickness: 0.1 }, provenance: estimated(MODULE) },
  { id: 'minute-hand', arbor: 'sub-minute', mechanism: 'motion-works', side: 'dial', pos: at(SUB, D.minuteHand), explode: { dz: -10 }, material: 'steel', shape: { kind: 'hand', length: 7.9, width: 0.4, thickness: 0.1 }, provenance: estimated(MODULE) },
  {
    id: 'sub-bridge', mechanism: 'frame', side: 'dial', pos: at(center, D.subBridge), explode: { dz: -7 }, material: 'rhodium',
    shape: {
      kind: 'bridge', thickness: 0.4, blend: 0.6,
      lobes: [...[ARCH_LEFT, ARCH_RIGHT].flatMap((side) => side.map((p, i) => ({ ...p, r: ARCH_R[i]! }))), { ...SUB, r: 1.6 }, ...ARCH.flatMap(([a, b]) => rod(a, b, 0.45))],
      jewels: [SUB],
      // photo:front (Azzurro)
      screws: [{ x: -11.5, y: -6.4 }, { x: 11.5, y: -6.4 }],
    },
    provenance: estimated(MODULE, 'abtw'),
  },
  // Strike works.
  {
    id: 'strike-lever', mechanism: 'strike', side: 'dial', pos: at(leverPivot, D.strike), explode: { dz: -4.5 }, material: 'steel',
    // photo:front (Azzurro): an arm running left from its jewel over the keyhole, its finger reaching up into it.
    shape: { kind: 'lever', outline: local(leverPivot, [[6.6, 2.7], [6.9, 3.9], [5.6, 4.4], [3.3, 4.5], [0.2, 5.2], [-0.9, 5.2], [-0.9, 4.4], [LEVER_TIP.x - 0.2, LEVER_TIP.y + 0.05], [LEVER_TIP.x, LEVER_TIP.y], [-0.1, 4.2], [3.3, 3.6], [5.3, 2.9]]), thickness: 0.2, hole: 0.18 },
    provenance: estimated(MODULE, 'deployant', 'sjx'),
  },
  {
    id: 'hammer', mechanism: 'strike', side: 'dial', pos: at(hammerPivot, D.strike), explode: { dz: -4.5 }, material: 'steel',
    shape: { kind: 'lever', outline: local(hammerPivot, HAMMER_OUTLINE), thickness: 0.25, hole: 0.2 },
    provenance: estimated(HAMMER, 'cw-loupe', 'deployant'),
  },
  {
    id: 'gong', mechanism: 'strike', side: 'dial', pos: at(GONG_CENTER, D.gong), explode: { dz: -3.5 }, material: 'steel',
    shape: { kind: 'gong', ...GONG_SHAPE },
    provenance: estimated(GONG, 'cw-handbook', 'cw-classic'),
  },
  { id: 'column-wheel', mechanism: 'strike', side: 'dial', pos: at(columnWheel, D.strike), explode: { dz: -4.5 }, material: 'steel', shape: { kind: 'cam', teeth: 6, radius: 1.9, thickness: 0.3 }, provenance: estimated(SILENCE, 'deployant') },
  {
    // Behind the strike lever, between it and the module plate. photo:front (Azzurro): the nose on the column wheel.
    id: 'switch-lever', mechanism: 'strike', side: 'dial', pos: at(switchPivot, DIAL - 0.1), explode: { dz: -4.5 }, material: 'steel',
    shape: { kind: 'lever', outline: local(switchPivot, [[6.1, 1.0], [7.3, 0.95], [8.5, 2.1], [7.0, 2.6], [6.2, 1.9]]), thickness: 0.15, hole: 0.15 },
    provenance: estimated(SILENCE, 'deployant'),
  },
  {
    id: 'indicator', mechanism: 'strike', side: 'dial', pos: at(indicatorPivot, D.cocks - 0.3), explode: { dz: -6.5 }, material: 'ruby',
    // photo:front (Azzurro): the red arrow, pointing at the printed wave while the strike is on.
    shape: { kind: 'lever', outline: local(indicatorPivot, [[7.55, 6.85], [10.4, 6.38], [8.0, 8.2]]), thickness: 0.15, hole: 0.12 },
    provenance: estimated(SILENCE, 'cw-loupe'),
  },
  {
    id: 'hammer-cock', mechanism: 'frame', side: 'dial', pos: at(center, D.cocks), explode: { dz: -6 }, material: 'rhodium',
    // photo:front (Azzurro): the songbird's left wing, from the hammer's jewel down to the V at 6.
    shape: { kind: 'bridge', thickness: 0.4, blend: BLEND, lobes: wing(hammerPivot, -1), jewels: [hammerPivot], screws: [{ x: -1.85, y: 11.4 }] },
    provenance: estimated(MODULE, 'deployant'),
  },
  {
    id: 'indicator-cock', mechanism: 'frame', side: 'dial', pos: at(center, D.cocks), explode: { dz: -6 }, material: 'rhodium',
    // photo:front (Azzurro): the right wing, from the indicator's jewel down to the V at 6.
    shape: { kind: 'bridge', thickness: 0.4, blend: BLEND, lobes: wing(indicatorPivot, 1), jewels: [indicatorPivot], screws: [{ x: 1.65, y: 11.4 }] },
    provenance: estimated(MODULE, 'deployant'),
  },
  {
    id: 'lever-cock', mechanism: 'frame', side: 'dial', pos: at(center, D.cocks), explode: { dz: -6 }, material: 'rhodium',
    // photo:front (Azzurro): round the lever's jewel and down to a screwed block.
    shape: { kind: 'bridge', thickness: 0.35, blend: BLEND, lobes: [{ ...leverPivot, r: 0.85 }, { x: 6.1, y: 4.7, r: 0.6 }, { x: 5.25, y: 5.95, r: 0.9 }, { x: 4.3, y: 6.7, r: 0.6 }, ...chain(leverPivot, { x: 6.1, y: 4.7 }, 0.6), ...chain({ x: 6.1, y: 4.7 }, { x: 5.25, y: 5.95 }, 0.6), ...chain({ x: 5.25, y: 5.95 }, { x: 4.3, y: 6.7 }, 0.6)], jewels: [leverPivot], screws: [{ x: 5.25, y: 5.95 }] },
    provenance: estimated(MODULE),
  },
];

const caliber: Caliber = {
  id: 'cw-fs01',
  name: 'Christopher Ward FS01',
  specs: {
    diameterMm: 25.6, heightMm: 4.6, jewels: 29, vph: 28800, powerReserveH: 38, hacking: true, quickDate: false,
    sourceIds: ['sellita-doctec', 'cw-handbook'],
  },
  // The chime pusher Christopher Ward places at 4 o'clock sits 25° below 3 o'clock (photo:front, Azzurro), nearly mirroring the crown.
  // The module plate runs out to 17.45 mm, past the gong's outer wire (photo:front, Azzurro).
  exterior: { frontZ: DIAL, secondsZ: -4.6, dialZ: DIAL, moduleDiameterMm: 35, pushers: [{ action: 'chime', hour: 3 + 25 / 30, z: -2.9 }] },
  parts,
  couplings: [
    { type: 'mesh', a: 'barrel', b: 'center-pinion' },
    { type: 'mesh', a: 'center-wheel', b: 'third-pinion' },
    { type: 'mesh', a: 'third-wheel', b: 'fourth-pinion' },
    { type: 'mesh', a: 'fourth-wheel', b: 'escape-pinion' },
    { type: 'escapement', balance: 'balance-wheel', fork: 'pallet-fork', escapeWheel: 'escape-wheel' },
    { type: 'slip', a: 'center-wheel', b: 'cannon-pinion' },
    { type: 'mesh', a: 'cannon-pinion', b: 'minute-wheel' },
    { type: 'mesh', a: 'module-center-wheel', b: 'intermediate-wheel' },
    { type: 'mesh', a: 'intermediate-wheel', b: 'sub-center-wheel' },
    { type: 'mesh', a: 'sub-cannon-pinion', b: 'sub-minute-wheel' },
    { type: 'mesh', a: 'sub-minute-pinion', b: 'sub-hour-wheel' },
    { type: 'strike', snail: 'snail', lever: 'strike-lever', hammer: 'hammer', lift: leverLift, swing: hammerSwing, silence: { wheel: 'column-wheel', switch: 'switch-lever', indicator: 'indicator', turn: INDICATOR_TURN, retreat: 0.3 } },
    { type: 'mesh', a: 'rotor-pinion', b: 'reverser-a' },
    { type: 'one-way', input: 'reverser-a', output: 'reverser-b' },
    { type: 'mesh', a: 'reverser-b', b: 'reduction-wheel' },
    { type: 'mesh', a: 'reduction-pinion', b: 'ratchet' },
    { type: 'keyless', stem: 'stem', slidingPinion: 'sliding-pinion', windingPinion: 'winding-pinion', settingWheel: 'setting-wheel', pull: 0.7, slidingThrow: 1.05 },
  ],
  chapters: [
    { id: 'time', flow: ['barrel', 'center', 'third', 'fourth', 'escape', 'fork', 'balance'] },
    { id: 'hands', flow: ['cannon', 'intermediate-wheel', 'sub-minute'] },
    { id: 'chime', flow: ['cannon', 'snail', 'strike-lever', 'hammer', 'gong'] },
    { id: 'auto', flow: [] },
    { id: 'crown', flow: [] },
  ],
  tour: [
    { id: 'time-overview', chapter: 'time', focus: null, side: 'back', speed: 0.1, xray: false, rotor: 'hide', cameraOffset: [-20, 32, 36], stats: [{ label: 'jewels', value: '29' }, { label: 'vph', value: '28,800' }] },
    { id: 'time-barrel', chapter: 'time', focus: 'barrel', side: 'back', speed: 0.1, xray: false, rotor: 'hide', cameraOffset: [-14, 22, 24], stats: [{ label: 'teeth', value: '84' }, { label: 'powerReserve', value: '38 h' }] },
    { id: 'time-center', chapter: 'time', focus: 'center', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-12, 20, 22], stats: [{ label: 'teeth', value: '80' }, { label: 'rotation', value: '1 rph' }] },
    { id: 'time-third', chapter: 'time', focus: 'third', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-10, 18, 20], stats: [{ label: 'teeth', value: '75' }, { label: 'leaves', value: '10' }] },
    { id: 'time-fourth', chapter: 'time', focus: 'fourth', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-10, 17, 19], stats: [{ label: 'teeth', value: '84' }, { label: 'rotation', value: '1 rpm' }] },
    { id: 'time-escape', chapter: 'time', focus: 'escape', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-7, 12, 14], stats: [{ label: 'teeth', value: '20' }, { label: 'rotation', value: '12 rpm' }] },
    { id: 'time-fork', chapter: 'time', focus: 'fork', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-7, 12, 14], stats: [{ label: 'pallets', value: '2' }, { label: 'lift', value: '50°' }] },
    { id: 'time-balance', chapter: 'time', focus: 'balance', side: 'back', speed: 0.1, xray: false, rotor: 'hide', cameraOffset: [-12, 19, 21], stats: [{ label: 'vph', value: '28,800' }, { label: 'frequency', value: '4 Hz' }] },
    { id: 'hands-overview', chapter: 'hands', focus: null, side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-16, 30, 32], stats: [{ label: 'ratio', value: '12 : 1' }, { label: 'wheels', value: '6' }] },
    { id: 'hands-cannon', chapter: 'hands', focus: 'cannon', side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-9, 16, 17], stats: [{ label: 'teeth', value: '12 / 40' }, { label: 'rotation', value: '1 rph' }] },
    { id: 'hands-intermediate', chapter: 'hands', focus: 'intermediate-wheel', side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-9, 16, 17], stats: [{ label: 'teeth', value: '60' }, { label: 'rotation', value: '2/3 rph' }] },
    { id: 'hands-sub', chapter: 'hands', focus: 'sub-minute', side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-9, 14, 18], stats: [{ label: 'teeth', value: '40 / 12' }, { label: 'rotation', value: '1 rph' }] },
    { id: 'hands-sub-minute-wheel', chapter: 'hands', focus: 'sub-minute-wheel', side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-8, 12, 16], stats: [{ label: 'teeth', value: '36 / 10' }, { label: 'reduction', value: '1 : 3' }] },
    { id: 'hands-hour', chapter: 'hands', focus: 'sub-hour', side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-9, 14, 18], stats: [{ label: 'teeth', value: '40' }, { label: 'rotation', value: '12 h' }] },
    { id: 'chime-overview', chapter: 'chime', focus: null, side: 'dial', speed: 120, xray: false, rotor: 'hide', ctl: 'chime', cameraOffset: [-16, 30, 32], stats: [{ label: 'chime', value: 'live:chime' }, { label: 'strikes', value: '1 / h' }] },
    { id: 'chime-snail', chapter: 'chime', focus: 'snail', side: 'dial', speed: 120, xray: true, rotor: 'hide', ctl: 'chime', cameraOffset: [-8, 14, 16], stats: [{ label: 'chime', value: 'live:chime' }, { label: 'rotation', value: '1 rph' }] },
    { id: 'chime-lever', chapter: 'chime', focus: 'strike-lever', side: 'dial', speed: 120, xray: true, rotor: 'hide', ctl: 'chime', cameraOffset: [-8, 14, 16], stats: [{ label: 'chime', value: 'live:chime' }, { label: 'strikes', value: '1 / h' }] },
    { id: 'chime-hammer', chapter: 'chime', focus: 'hammer', side: 'dial', speed: 120, xray: true, rotor: 'hide', ctl: 'chime', cameraOffset: [-10, 16, 18], stats: [{ label: 'chime', value: 'live:chime' }, { label: 'strikes', value: '1 / h' }] },
    { id: 'chime-gong', chapter: 'chime', focus: 'gong', side: 'dial', speed: 120, xray: false, rotor: 'hide', ctl: 'chime', cameraOffset: [-16, 28, 30], stats: [{ label: 'chime', value: 'live:chime' }, { label: 'strikes', value: '1 / h' }] },
    { id: 'chime-silence', chapter: 'chime', focus: 'column-wheel', side: 'dial', speed: 120, xray: false, rotor: 'hide', ctl: 'chime', cameraOffset: [-8, 14, 16], stats: [{ label: 'chime', value: 'live:chime' }, { label: 'teeth', value: '6' }] },
    { id: 'auto-rotor', chapter: 'auto', focus: 'rotor', side: 'back', speed: 0.1, xray: false, rotor: 'show', cameraOffset: [-18, 30, 32], stats: [{ label: 'direction', value: '⟲ ⟳' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'auto-reversers', chapter: 'auto', focus: 'reversers', side: 'back', speed: 0.1, xray: false, rotor: 'xray', cameraOffset: [-12, 22, 24], stats: [{ label: 'system', value: 'ratchet' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'auto-reduction', chapter: 'auto', focus: 'reduction', side: 'back', speed: 0.1, xray: false, rotor: 'xray', cameraOffset: [-12, 22, 24], stats: [{ label: 'teeth', value: '22 / 9' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'auto-ratchet', chapter: 'auto', focus: 'ratchet', side: 'back', speed: 0.1, xray: false, rotor: 'xray', cameraOffset: [-13, 24, 26], stats: [{ label: 'teeth', value: '50' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'crown-stem', chapter: 'crown', focus: 'stem', side: 'dial', speed: 0.1, xray: false, rotor: 'hide', ctl: 'crown', cameraOffset: [-10, 20, 22], stats: [{ label: 'position', value: 'live:crown' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'crown-sliding', chapter: 'crown', focus: 'sliding-pinion', side: 'dial', speed: 0.1, xray: false, rotor: 'hide', ctl: 'crown', cameraOffset: [-8, 15, 16], stats: [{ label: 'position', value: 'live:crown' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'crown-hacking', chapter: 'crown', focus: 'balance', side: 'back', speed: 1, xray: false, rotor: 'hide', ctl: 'crown', cameraOffset: [-12, 19, 21], stats: [{ label: 'position', value: 'live:crown' }, { label: 'vph', value: '28,800' }] },
  ],
  sources: [
    { id: 'sellita-doctec', title: 'SW200-1 technical documentation — Sellita', url: 'https://www.sellita.ch/scripts/calibres/images/DocTec_SW200-1_7.pdf' },
    { id: 'cw-handbook', title: 'C1 Bel Canto owner\'s handbook — Christopher Ward', url: 'https://www.christopherward.com/on/demandware.static/-/Library-Sites-cw-library/default/dw2cdd0e05/pdfs/Dress/c1-bel-canto.pdf' },
    { id: 'cw-loupe', title: 'C1 Bel Canto: our finest hour — Christopher Ward', url: 'https://www.christopherward.com/int/c1-bel-canto-the-chime-is-now.html' },
    { id: 'cw-classic', title: 'C1 Bel Canto Classic — Christopher Ward', url: 'https://www.christopherward.com/int/bel-canto-classic-watches/C1-Bel-Canto-Classic/C01-41APT3-T00B0-MB.html' },
    { id: 'deployant', title: 'Comprehensive review of the Christopher Ward Bel Canto Viola — Deployant', url: 'https://deployant.com/comprehensive-review-of-the-christopher-ward-bel-canto-viola/' },
    { id: 'sjx', title: 'Christopher Ward C1 Bel Canto Classic — SJX', url: 'https://watchesbysjx.com/2024/11/christopher-ward-c1-bel-canto-classic.html' },
    { id: 'kaminsky', title: 'The story behind the C1 Bel Canto & caliber FS01 — KaminskyBlog', url: 'https://kaminskyblog.com/2025/03/08/the-story-behind-christopher-ward-c1-bel-canto-caliber-fs01/' },
    { id: 'abtw', title: 'Hands-on debut: the Christopher Ward C1 Bel Canto — aBlogtoWatch', url: 'https://www.ablogtowatch.com/hands-on-debut-the-christopher-ward-c1-bel-canto-rings-true/' },
    { id: 'watchfinder', title: 'Christopher Ward C1 Bel Canto — Watchfinder & Co. (CAD layout, 10:56)', url: 'https://www.youtube.com/watch?v=G9RwelExeQk' },
  ],
};

export default caliber;
