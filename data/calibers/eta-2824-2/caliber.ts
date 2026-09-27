import type { Caliber, Part } from '../../../src/model/schema';
import { centerDistance, place, type P2 } from '../../../src/kinematics/gearMath';

const sourced = (...sourceIds: string[]) => ({ confidence: 'sourced' as const, sourceIds });
const estimated = (note: string) => ({ confidence: 'estimated' as const, sourceIds: [], note });
const LAYOUT = 'Position and module chosen to fit the 25.6 mm movement; not measured from a real part.';

const Z = { barrel: 84, centerPinion: 12, center: 80, thirdPinion: 10, third: 75, fourthPinion: 10, fourth: 84, escapePinion: 7, escape: 20 };
const M = { barrel: 0.11, center: 0.085, third: 0.075, fourth: 0.06 };

const center: P2 = { x: 0, y: 0 };
const barrel = place(center, centerDistance(M.barrel, Z.barrel, Z.centerPinion), 90);
const third = place(center, centerDistance(M.center, Z.center, Z.thirdPinion), -130);
const fourth = place(third, centerDistance(M.third, Z.third, Z.fourthPinion), -50);
const escape = place(fourth, centerDistance(M.fourth, Z.fourth, Z.escapePinion), -15);
const fork = place(escape, 2.05, 30);
const balance = place(fork, 3.9, 30);
const MW = { cannon: 12, minuteWheel: 36, minutePinion: 10, hourWheel: 40, dateDriver: 80 };
const mMotion = 0.1;
const mHour = 0.096;
const minuteWheel = place(center, centerDistance(mMotion, MW.cannon, MW.minuteWheel), -20);
const dateDriver = place(center, centerDistance(mHour, MW.hourWheel, MW.dateDriver), 150);
// The finger (+Y) should point outward, along the driver's direction from the center, in the middle of the
// date-change window (95 % of a turn). The driver turns clockwise in local coordinates (negative angles).
const dateDriverRest = ((Math.atan2(dateDriver.y, dateDriver.x) - Math.PI / 2 + 0.95 * Math.PI * 2) % (Math.PI * 2));
const MOTION = 'Motion-works tooth counts give the required 1:12; the real 2824-2 counts are not sourced.';

const forkRest = Math.atan2(escape.y - fork.y, escape.x - fork.x) - Math.PI / 2; // pallets (+Y) face the escape wheel
const balanceRest = Math.atan2(fork.y - balance.y, fork.x - balance.x); // roller jewel (+X) faces the fork
const cockBase = { x: balance.x + 2.8, y: balance.y + 3.4 };
const offset = (p: P2, dx: number, dy: number) => ({ x: p.x + dx, y: p.y + dy });

const at = (p: P2, z: number) => ({ x: p.x, y: p.y, z });

const parts: Part[] = [
  {
    id: 'plate', mechanism: 'frame', side: 'back', pos: at(center, -0.6), explode: { dz: -0.5 }, material: 'plate',
    shape: { kind: 'plate', radius: 12.8, thickness: 1.1 }, provenance: sourced('eta-17jewels'),
  },
  {
    id: 'barrel', arbor: 'barrel', mechanism: 'power', side: 'back', pos: at(barrel, 0.6), explode: { dz: 3.2 }, material: 'gilt',
    shape: { kind: 'barrel', teeth: Z.barrel, module: M.barrel, thickness: 0.35, drumHeight: 1.3 }, provenance: estimated(LAYOUT),
  },
  {
    id: 'ratchet', mechanism: 'power', side: 'back', pos: at(barrel, 3.95), explode: { dz: 12.5 }, material: 'steel',
    shape: { kind: 'ratchet', teeth: 50, module: 0.12, thickness: 0.28 }, provenance: estimated(LAYOUT),
  },
  {
    id: 'center-pinion', arbor: 'center', mechanism: 'going-train', side: 'back', pos: at(center, 0.75), explode: { dz: 4.4 }, material: 'steel',
    shape: { kind: 'pinion', leaves: Z.centerPinion, module: M.barrel, length: 0.9 }, provenance: estimated(LAYOUT),
  },
  {
    id: 'center-wheel', arbor: 'center', mechanism: 'going-train', side: 'back', pos: at(center, 1.25), explode: { dz: 4.4 }, material: 'gilt',
    shape: { kind: 'wheel', teeth: Z.center, module: M.center, thickness: 0.28, spokes: 4 }, provenance: sourced('firgelli-train'),
  },
  {
    id: 'third-pinion', arbor: 'third', mechanism: 'going-train', side: 'back', pos: at(third, 1.25), explode: { dz: 5.2 }, material: 'steel',
    shape: { kind: 'pinion', leaves: Z.thirdPinion, module: M.center, length: 0.9 }, provenance: sourced('firgelli-train'),
  },
  {
    id: 'third-wheel', arbor: 'third', mechanism: 'going-train', side: 'back', pos: at(third, 1.85), explode: { dz: 5.2 }, material: 'gilt',
    shape: { kind: 'wheel', teeth: Z.third, module: M.third, thickness: 0.24, spokes: 5 }, provenance: sourced('firgelli-train'),
  },
  {
    id: 'fourth-pinion', arbor: 'fourth', mechanism: 'going-train', side: 'back', pos: at(fourth, 1.85), explode: { dz: 6.0 }, material: 'steel',
    shape: { kind: 'pinion', leaves: Z.fourthPinion, module: M.third, length: 0.9 }, provenance: sourced('firgelli-train'),
  },
  {
    id: 'fourth-wheel', arbor: 'fourth', mechanism: 'going-train', side: 'back', pos: at(fourth, 2.35), explode: { dz: 6.0 }, material: 'gilt',
    shape: { kind: 'wheel', teeth: Z.fourth, module: M.fourth, thickness: 0.22, spokes: 5 },
    provenance: estimated('84 teeth derived from 28,800 vph with a 20-tooth escape wheel and a 7-leaf pinion; FIRGELLI lists 70.'),
  },
  {
    id: 'escape-pinion', arbor: 'escape', mechanism: 'escapement', side: 'back', pos: at(escape, 2.35), explode: { dz: 6.8 }, material: 'steel',
    shape: { kind: 'pinion', leaves: Z.escapePinion, module: M.fourth, length: 0.8 }, provenance: sourced('firgelli-train'),
  },
  {
    id: 'escape-wheel', arbor: 'escape', mechanism: 'escapement', side: 'back', pos: at(escape, 1.9), explode: { dz: 6.8 }, material: 'steel',
    shape: { kind: 'escape-wheel', teeth: Z.escape, outerRadius: 1.45, thickness: 0.16 }, provenance: sourced('eta-17jewels'),
  },
  {
    id: 'pallet-fork', arbor: 'fork', rest: forkRest, mechanism: 'escapement', side: 'back', pos: at(fork, 1.9), explode: { dz: 7.4 }, material: 'steel',
    shape: { kind: 'pallet-fork', span: 2.6, length: 3.0, thickness: 0.14 }, provenance: estimated(LAYOUT),
  },
  {
    id: 'balance-wheel', arbor: 'balance', rest: balanceRest, mechanism: 'regulator', side: 'back', pos: at(balance, 2.0), explode: { dz: 9.0 }, material: 'balance',
    shape: { kind: 'balance', radius: 4.1, rimThickness: 0.22, arms: 2 }, provenance: estimated(LAYOUT),
  },
  {
    id: 'hairspring', arbor: 'balance', mechanism: 'regulator', side: 'back', pos: at(balance, 2.55), explode: { dz: 9.0 }, material: 'steel',
    shape: { kind: 'hairspring', turns: 12, innerRadius: 0.55, pitch: 0.2 }, provenance: estimated(LAYOUT),
  },
  {
    id: 'train-bridge', mechanism: 'frame', side: 'back', pos: at(center, 3.2), explode: { dz: 11 }, material: 'rhodium',
    shape: {
      kind: 'bridge', thickness: 0.55,
      lobes: [
        { ...center, r: 1.4 }, { ...third, r: 1.3 }, { ...fourth, r: 1.3 }, { ...escape, r: 1.1 },
        { ...offset(third, 1.9, 1.2), r: 0.9 }, { ...offset(center, -1.7, -1.4), r: 0.9 },
      ],
      jewels: [center, third, fourth, escape],
      screws: [offset(third, 1.9, 1.2), offset(center, -1.7, -1.4)],
    },
    provenance: estimated(LAYOUT),
  },
  {
    id: 'barrel-bridge', mechanism: 'frame', side: 'back', pos: at(center, 3.4), explode: { dz: 9.5 }, material: 'rhodium',
    shape: {
      kind: 'bridge', thickness: 0.55,
      lobes: [{ ...barrel, r: 4.6 }, { ...offset(barrel, -3.2, 2.6), r: 0.9 }, { ...offset(barrel, 2.7, -3.3), r: 0.9 }],
      jewels: [barrel],
      screws: [offset(barrel, -3.2, 2.6), offset(barrel, 2.7, -3.3)],
    },
    provenance: estimated(LAYOUT),
  },
  {
    id: 'balance-cock', mechanism: 'frame', side: 'back', pos: at(center, 3.1), explode: { dz: 13 }, material: 'rhodium',
    shape: {
      kind: 'bridge', thickness: 0.55,
      lobes: [{ ...balance, r: 1.0 }, { x: (balance.x + cockBase.x) / 2, y: (balance.y + cockBase.y) / 2, r: 0.8 }, { ...cockBase, r: 1.3 }],
      jewels: [balance],
      screws: [cockBase],
    },
    provenance: estimated(LAYOUT),
  },
  { id: 'cannon-pinion', arbor: 'cannon', mechanism: 'motion-works', side: 'dial', pos: at(center, -1.6), explode: { dz: -2.4 }, material: 'steel', shape: { kind: 'pinion', leaves: MW.cannon, module: mMotion, length: 0.8 }, provenance: estimated(MOTION) },
  { id: 'minute-hand', arbor: 'cannon', mechanism: 'motion-works', side: 'dial', pos: at(center, -3.25), explode: { dz: -7.2 }, material: 'blued', shape: { kind: 'hand', length: 9.6, width: 0.32, thickness: 0.08 }, provenance: estimated(LAYOUT) },
  { id: 'minute-wheel', arbor: 'minute-wheel', mechanism: 'motion-works', side: 'dial', pos: at(minuteWheel, -1.6), explode: { dz: -3.2 }, material: 'gilt', shape: { kind: 'wheel', teeth: MW.minuteWheel, module: mMotion, thickness: 0.18, spokes: 0 }, provenance: estimated(MOTION) },
  { id: 'minute-pinion', arbor: 'minute-wheel', mechanism: 'motion-works', side: 'dial', pos: at(minuteWheel, -2.05), explode: { dz: -3.2 }, material: 'steel', shape: { kind: 'pinion', leaves: MW.minutePinion, module: mHour, length: 0.6 }, provenance: estimated(MOTION) },
  { id: 'hour-wheel', arbor: 'hour', mechanism: 'motion-works', side: 'dial', pos: at(center, -2.05), explode: { dz: -4.2 }, material: 'gilt', shape: { kind: 'wheel', teeth: MW.hourWheel, module: mHour, thickness: 0.16, spokes: 4 }, provenance: estimated(MOTION) },
  { id: 'hour-hand', arbor: 'hour', mechanism: 'motion-works', side: 'dial', pos: at(center, -2.95), explode: { dz: -6.2 }, material: 'blued', shape: { kind: 'hand', length: 6.2, width: 0.42, thickness: 0.08 }, provenance: estimated(LAYOUT) },
  { id: 'date-driver', arbor: 'date-driver', rest: dateDriverRest, mechanism: 'calendar', side: 'dial', pos: at(dateDriver, -2.05), explode: { dz: -3.0 }, material: 'gilt', shape: { kind: 'date-driver', teeth: MW.dateDriver, module: mHour, thickness: 0.16, fingerLength: 3.4 }, provenance: estimated(MOTION) },
  { id: 'date-ring', mechanism: 'calendar', side: 'dial', pos: at(center, -2.35), explode: { dz: -1.6 }, material: 'plate', shape: { kind: 'date-ring', teeth: 31, innerRadius: 9.3, outerRadius: 12.3, thickness: 0.16 }, provenance: sourced('eta-17jewels') },
];

const caliber: Caliber = {
  id: 'eta-2824-2',
  name: 'ETA 2824-2',
  specs: {
    diameterMm: 25.6, heightMm: 4.6, jewels: 25, vph: 28800, powerReserveH: 38, hacking: true, quickDate: true,
    sourceIds: ['eta-17jewels', 'calibercorner', 'eta-manual'],
  },
  parts,
  couplings: [
    { type: 'mesh', a: 'barrel', b: 'center-pinion' },
    { type: 'mesh', a: 'center-wheel', b: 'third-pinion' },
    { type: 'mesh', a: 'third-wheel', b: 'fourth-pinion' },
    { type: 'mesh', a: 'fourth-wheel', b: 'escape-pinion' },
    { type: 'escapement', balance: 'balance-wheel', fork: 'pallet-fork', escapeWheel: 'escape-wheel' },
    { type: 'slip', a: 'center-wheel', b: 'cannon-pinion' },
    { type: 'mesh', a: 'cannon-pinion', b: 'minute-wheel' },
    { type: 'mesh', a: 'minute-pinion', b: 'hour-wheel' },
    { type: 'mesh', a: 'hour-wheel', b: 'date-driver' },
    { type: 'intermittent', driver: 'date-driver', driven: 'date-ring' },
  ],
  chapters: [
    { id: 'time', flow: ['barrel', 'center', 'third', 'fourth', 'escape', 'fork', 'balance'] },
    { id: 'hands', flow: [] },
    { id: 'date', flow: [] },
  ],
  tour: [
    { id: 'time-overview', chapter: 'time', focus: null, side: 'back', speed: 0.1, xray: false, rotor: 'hide', cameraOffset: [-20, 32, 36], stats: [{ label: 'parts', value: '~130' }, { label: 'jewels', value: '25' }] },
    { id: 'time-barrel', chapter: 'time', focus: 'barrel', side: 'back', speed: 0.1, xray: false, rotor: 'hide', cameraOffset: [-14, 22, 24], stats: [{ label: 'teeth', value: '84' }, { label: 'powerReserve', value: '38 h' }] },
    { id: 'time-center', chapter: 'time', focus: 'center', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-12, 20, 22], stats: [{ label: 'teeth', value: '80' }, { label: 'rotation', value: '1 rph' }] },
    { id: 'time-third', chapter: 'time', focus: 'third', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-10, 18, 20], stats: [{ label: 'teeth', value: '75' }, { label: 'leaves', value: '10' }] },
    { id: 'time-fourth', chapter: 'time', focus: 'fourth', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-10, 17, 19], stats: [{ label: 'teeth', value: '84' }, { label: 'rotation', value: '1 rpm' }] },
    { id: 'time-escape', chapter: 'time', focus: 'escape', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-7, 12, 14], stats: [{ label: 'teeth', value: '20' }, { label: 'rotation', value: '12 rpm' }] },
    { id: 'time-fork', chapter: 'time', focus: 'fork', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-7, 12, 14], stats: [{ label: 'pallets', value: '2' }, { label: 'lift', value: '~10°' }] },
    { id: 'time-balance', chapter: 'time', focus: 'balance', side: 'back', speed: 0.1, xray: false, rotor: 'hide', cameraOffset: [-12, 19, 21], stats: [{ label: 'vph', value: '28,800' }, { label: 'frequency', value: '4 Hz' }] },
    { id: 'hands-overview', chapter: 'hands', focus: null, side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-16, 30, 32], stats: [{ label: 'ratio', value: '12 : 1' }, { label: 'wheels', value: '3' }] },
    { id: 'hands-cannon', chapter: 'hands', focus: 'cannon', side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-9, 16, 17], stats: [{ label: 'teeth', value: '12' }, { label: 'rotation', value: '1 rph' }] },
    { id: 'hands-minute-wheel', chapter: 'hands', focus: 'minute-wheel', side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-9, 16, 17], stats: [{ label: 'teeth', value: '36 / 10' }, { label: 'reduction', value: '1 : 3' }] },
    { id: 'hands-hour', chapter: 'hands', focus: 'hour', side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-10, 17, 18], stats: [{ label: 'teeth', value: '40' }, { label: 'rotation', value: '12 h' }] },
    { id: 'date-driver', chapter: 'date', focus: 'date-driver', side: 'dial', speed: 6000, xray: false, rotor: 'hide', cameraOffset: [-12, 20, 22], stats: [{ label: 'teeth', value: '80' }, { label: 'rotation', value: '24 h' }] },
    { id: 'date-ring', chapter: 'date', focus: 'date-ring', side: 'dial', speed: 6000, xray: false, rotor: 'hide', cameraOffset: [-14, 26, 28], stats: [{ label: 'teeth', value: '31' }, { label: 'step', value: '1 / day' }] },
  ],
  sources: [
    { id: 'eta-17jewels', title: 'ETA 2824-2 — 17jewels.info', url: 'https://17jewels.info/movements/e/eta/eta-2824-2/' },
    { id: 'calibercorner', title: 'ETA Caliber 2824-2 — Caliber Corner', url: 'https://calibercorner.com/eta-caliber-2824-2/' },
    { id: 'eta-manual', title: 'ETA 2824-2 manual & instructions', url: 'https://markcarson.com/wp-content/uploads/2024/01/Instructions-ETA-2824-2.pdf' },
    { id: 'firgelli-train', title: 'Watch Train Mechanism Explained — FIRGELLI', url: 'https://www.firgelliauto.com/blogs/mechanisms/watch-train' },
  ],
};

export default caliber;
