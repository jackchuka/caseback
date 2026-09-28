import type { Caliber, Part } from '../../../src/model/schema';
import { centerDistance, place, type P2 } from '../../../src/kinematics/gearMath';

const sourced = (...sourceIds: string[]) => ({ confidence: 'sourced' as const, sourceIds });
const estimated = (note: string, ...sourceIds: string[]) => ({ confidence: 'estimated' as const, sourceIds, note });
const LAYOUT = 'Placed after the layout drawing in SII\'s NH35A specification (barrel toward 12, balance toward 9, first reduction wheel toward 6 from the dial); sizes and tooth counts are not measured from real parts.';

// Direct centre seconds: the fourth wheel sits on the centre, above the centre wheel, as in the parts catalogue.
const Z = { barrel: 82, centerPinion: 16, center: 64, thirdPinion: 8, third: 60, fourthPinion: 8, fourth: 84, escapePinion: 7, escape: 15 };
const M = { barrel: 0.147, center: 0.085, third: 0.09, fourth: 0.06 };
const TRAIN = 'Tooth counts chosen to give 1 rph, 1 rpm and 21,600 vph with a 15-tooth escape wheel; the real NH35A counts are not published.';

const center: P2 = { x: 0, y: 0 };
const barrel = place(center, centerDistance(M.barrel, Z.barrel, Z.centerPinion), -73.4);
const third = place(center, centerDistance(M.center, Z.center, Z.thirdPinion), 60);
const escape = place(center, centerDistance(M.fourth, Z.fourth, Z.escapePinion), 160);
const LINE = 181.4;
const fork = place(escape, 2.05, LINE);
const balance = place(fork, 3.9, LINE);

const MW = { cannon: 10, minuteWheel: 30, minutePinion: 8, hourWheel: 32, dateDriver: 64 };
const mMotion = 0.1;
const minuteWheel = place(center, centerDistance(mMotion, MW.cannon, MW.minuteWheel), -30);
const dateDriver = place(center, centerDistance(mMotion, MW.hourWheel, MW.dateDriver), 160);
// The finger (+Y) points outward, along the driver's direction from the centre, in the middle of the date-change
// window (95 % of a turn); the driver turns clockwise in local coordinates.
const dateDriverRest = (Math.atan2(dateDriver.y, dateDriver.x) - Math.PI / 2 + 0.95 * Math.PI * 2) % (Math.PI * 2);
const MOTION = 'Motion-works tooth counts give the required 1:12 and 1 turn a day for the date driver; the real NH35A counts are not published.';

// Magic Lever: the rotor's own gear turns the first reduction wheel, whose eccentric strokes the pawl lever; the
// lever's claws turn the second reduction wheel one way only, and its pinion turns the ratchet wheel.
const AUTO = 'Magic Lever parts and their order are from the NH3 parts catalogue; sizes, tooth counts and the eccentric throw are estimates.';
const A = { rotorGear: 56, first: 58, second: 36, secondPinion: 10, ratchet: 72 };
const mAuto = 0.1;
const mRatchet = 0.12;
const THROW = 0.3;
const first = place(center, centerDistance(mAuto, A.rotorGear, A.first), 92.4);
const second = place(barrel, centerDistance(mRatchet, A.secondPinion, A.ratchet), 40);
const pin = { x: first.x + THROW, y: first.y };
const leverLength = Math.hypot(second.x - pin.x, second.y - pin.y);
const leverRest = Math.atan2(second.y - pin.y, second.x - pin.x);

// Heights. SII's hand-fitting drawing measures from the dial support surface (DIAL): the dial is 0.40 thick; the
// hour, minute and seconds hands sit 0.60, 1.19 and 1.81 above the dial (type M hands); the stem axis is 1.92 behind
// the support surface; the movement is 5.32 from that surface to the back of the rotor.
const DIAL = -1.75;
const DIAL_THICKNESS = 0.4;
const PLATE = { front: -1.05, back: 0.35 };
const STEM_Z = DIAL + 1.92;
const H = {
  barrel: 0.65,
  centerPinion: 0.65,
  centerWheel: 0.95,
  thirdPinion: 0.95,
  thirdWheel: 1.3,
  fourthPinion: 1.35,
  fourthWheel: 1.55,
  escapePinion: 1.55,
  escapeWheel: 1.25,
  palletFork: 1.25,
  balance: 1.15,
  hairspring: 1.55,
  // One barrel-and-train-wheel bridge, the pallet bridge and the balance cock, all at one level.
  bridges: 1.95,
  // The automatic works stand on top of the bridge, under the automatic train bridge.
  automatic: 2.45,
  eccentric: 2.65,
  lever: 2.68,
  secondPinion: 2.47,
  autoBridge: 2.95,
  rotor: 3.55,
};
const BRIDGE = 0.3;
const pinSpan = (z: number, bridgeZ: number, t = BRIDGE) => ({ below: z - PLATE.back, above: bridgeZ + t / 2 - z });
const stemIn = 5.4;
const stemOut = 16.2;
const KEYLESS = 'The stem runs in a pocket in the plate at SII\'s published depth; its pinions and setting wheel are illustrative.';

const forkRest = Math.atan2(escape.y - fork.y, escape.x - fork.x) - Math.PI / 2;
const balanceRest = Math.atan2(fork.y - balance.y, fork.x - balance.x);
const cockBase = place(balance, 4.2, 50);
const offset = (p: P2, dx: number, dy: number) => ({ x: p.x + dx, y: p.y + dy });
const at = (p: P2, z: number) => ({ x: p.x, y: p.y, z });

const bridgeScrews = [{ x: -3.5, y: -3.0 }, { x: 4.3, y: 2.6 }, offset(barrel, 4.9, -1.6)];
const autoScrews = [offset(first, -3.6, 1.2), offset(second, 1.4, 2.2)];

const parts: Part[] = [
  {
    id: 'plate', mechanism: 'frame', side: 'back', pos: at(center, (PLATE.front + PLATE.back) / 2), explode: { dz: -0.5 }, material: 'plate',
    shape: { kind: 'plate', radius: 13.7, thickness: PLATE.back - PLATE.front, slots: [{ from: { x: stemIn - 0.2, y: 0 }, to: { x: 12.4, y: 0 }, r: 1.05 }] },
    provenance: sourced('sii-spec'),
  },
  {
    id: 'barrel', arbor: 'barrel', mechanism: 'power', side: 'back', pos: at(barrel, H.barrel), explode: { dz: 3.2 }, material: 'gilt',
    shape: { kind: 'barrel', teeth: Z.barrel, module: M.barrel, thickness: 0.3, drumHeight: 0.9 },
    provenance: estimated('82 teeth over a 16-leaf centre pinion give 5.1 h per barrel turn: SII\'s 41 h over the 8 ratchet turns its guide gives for a full wind.'),
  },
  {
    id: 'ratchet', mechanism: 'power', side: 'back', pos: at(barrel, H.automatic), explode: { dz: 12.5 }, material: 'steel',
    shape: { kind: 'ratchet', teeth: A.ratchet, module: mRatchet, thickness: 0.25 }, provenance: estimated(AUTO, 'tmi-guide', 'wmj-magic-lever'),
  },
  {
    id: 'center-pinion', arbor: 'center', mechanism: 'going-train', side: 'back', pos: at(center, H.centerPinion), explode: { dz: 4.4 }, material: 'steel',
    shape: { kind: 'pinion', leaves: Z.centerPinion, module: M.barrel, length: 0.6 }, provenance: estimated(TRAIN, 'sii-spec'),
  },
  {
    id: 'center-wheel', arbor: 'center', mechanism: 'going-train', side: 'back', pos: at(center, H.centerWheel), explode: { dz: 4.4 }, material: 'gilt',
    shape: { kind: 'wheel', teeth: Z.center, module: M.center, thickness: 0.2, spokes: 4, pin: { below: H.centerWheel - PLATE.back, above: 0.15 } }, provenance: estimated(TRAIN, 'sii-spec'),
  },
  {
    id: 'third-pinion', arbor: 'third', mechanism: 'going-train', side: 'back', pos: at(third, H.thirdPinion), explode: { dz: 5.2 }, material: 'steel',
    shape: { kind: 'pinion', leaves: Z.thirdPinion, module: M.center, length: 0.6 }, provenance: estimated(TRAIN, 'sii-spec'),
  },
  {
    id: 'third-wheel', arbor: 'third', mechanism: 'going-train', side: 'back', pos: at(third, H.thirdWheel), explode: { dz: 5.2 }, material: 'gilt',
    shape: { kind: 'wheel', teeth: Z.third, module: M.third, thickness: 0.2, spokes: 5, pin: pinSpan(H.thirdWheel, H.bridges) }, provenance: estimated(TRAIN, 'sii-spec'),
  },
  {
    id: 'fourth-pinion', arbor: 'fourth', mechanism: 'going-train', side: 'back', pos: at(center, H.fourthPinion), explode: { dz: 6.0 }, material: 'steel',
    shape: { kind: 'pinion', leaves: Z.fourthPinion, module: M.third, length: 0.4 }, provenance: estimated(TRAIN, 'sii-spec'),
  },
  {
    id: 'fourth-wheel', arbor: 'fourth', mechanism: 'going-train', side: 'back', pos: at(center, H.fourthWheel), explode: { dz: 6.0 }, material: 'gilt',
    shape: { kind: 'wheel', teeth: Z.fourth, module: M.fourth, thickness: 0.2, spokes: 5, pin: pinSpan(H.fourthWheel, H.bridges) },
    provenance: estimated('On the centre (direct centre seconds), per the long-arbored fourth wheel in the parts catalogue. 84 teeth over a 7-leaf escape pinion give 21,600 vph.'),
  },
  {
    id: 'escape-pinion', arbor: 'escape', mechanism: 'escapement', side: 'back', pos: at(escape, H.escapePinion), explode: { dz: 6.8 }, material: 'steel',
    shape: { kind: 'pinion', leaves: Z.escapePinion, module: M.fourth, length: 0.4 }, provenance: estimated(TRAIN, 'sii-spec'),
  },
  {
    id: 'escape-wheel', arbor: 'escape', mechanism: 'escapement', side: 'back', pos: at(escape, H.escapeWheel), explode: { dz: 6.8 }, material: 'steel',
    shape: { kind: 'escape-wheel', teeth: Z.escape, outerRadius: 1.45, thickness: 0.16 }, provenance: estimated(TRAIN, 'sii-spec'),
  },
  {
    id: 'pallet-fork', arbor: 'fork', rest: forkRest, mechanism: 'escapement', side: 'back', pos: at(fork, H.palletFork), explode: { dz: 7.4 }, material: 'steel',
    shape: { kind: 'pallet-fork', span: 2.6, length: 3.0, thickness: 0.14 }, provenance: estimated(LAYOUT, 'sii-spec'),
  },
  {
    id: 'balance-wheel', arbor: 'balance', rest: balanceRest, mechanism: 'regulator', side: 'back', pos: at(balance, H.balance), explode: { dz: 9.0 }, material: 'balance',
    shape: { kind: 'balance', radius: 3.9, rimThickness: 0.22, arms: 2, pin: pinSpan(H.balance, H.bridges) }, provenance: estimated(LAYOUT, 'sii-spec'),
  },
  {
    id: 'hairspring', arbor: 'balance', mechanism: 'regulator', side: 'back', pos: at(balance, H.hairspring), explode: { dz: 9.0 }, material: 'steel',
    shape: { kind: 'hairspring', turns: 12, innerRadius: 0.55, pitch: 0.2 }, provenance: estimated(LAYOUT, 'sii-spec'),
  },
  {
    id: 'train-bridge', mechanism: 'frame', side: 'back', pos: at(center, H.bridges), explode: { dz: 10 }, material: 'rhodium',
    shape: {
      kind: 'bridge', thickness: BRIDGE,
      lobes: [{ ...barrel, r: 3.2 }, { ...center, r: 1.4 }, { ...third, r: 1.2 }, { ...escape, r: 1.0 }, ...bridgeScrews.map((s) => ({ ...s, r: 0.9 }))],
      // The centre and barrel jewels sit under the rotor's gear and the ratchet wheel; only these two show.
      jewels: [third, escape],
      screws: bridgeScrews,
    },
    provenance: estimated('One barrel-and-train-wheel bridge, as in the NH3 parts catalogue; outline estimated.'),
  },
  {
    id: 'pallet-bridge', mechanism: 'frame', side: 'back', pos: at(center, H.bridges), explode: { dz: 11 }, material: 'rhodium',
    shape: { kind: 'bridge', thickness: BRIDGE, lobes: [{ ...fork, r: 0.8 }, { ...offset(fork, -0.4, -2.0), r: 0.8 }], jewels: [fork], screws: [offset(fork, -0.4, -2.0)] },
    provenance: estimated(LAYOUT, 'sii-spec'),
  },
  {
    id: 'balance-cock', mechanism: 'frame', side: 'back', pos: at(center, H.bridges), explode: { dz: 13 }, material: 'rhodium',
    shape: {
      kind: 'bridge', thickness: BRIDGE,
      lobes: [{ ...balance, r: 1.0 }, { x: (balance.x + cockBase.x) / 2, y: (balance.y + cockBase.y) / 2, r: 0.8 }, { ...cockBase, r: 1.3 }],
      jewels: [balance],
      screws: [cockBase],
    },
    provenance: estimated(LAYOUT, 'sii-spec'),
  },
  { id: 'cannon-pinion', arbor: 'cannon', mechanism: 'motion-works', side: 'dial', pos: at(center, -1.3), explode: { dz: -2.4 }, material: 'steel', shape: { kind: 'pinion', leaves: MW.cannon, module: mMotion, length: 0.5 }, provenance: estimated(MOTION) },
  { id: 'minute-hand', arbor: 'cannon', mechanism: 'motion-works', side: 'dial', pos: at(center, DIAL - DIAL_THICKNESS - 1.28), explode: { dz: -7.2 }, material: 'blued', shape: { kind: 'hand', length: 10.5, width: 0.32, thickness: 0.18 }, provenance: sourced('sii-spec') },
  { id: 'minute-wheel', arbor: 'minute-wheel', mechanism: 'motion-works', side: 'dial', pos: at(minuteWheel, -1.2), explode: { dz: -3.2 }, material: 'gilt', shape: { kind: 'wheel', teeth: MW.minuteWheel, module: mMotion, thickness: 0.16, spokes: 0 }, provenance: estimated(MOTION) },
  { id: 'minute-pinion', arbor: 'minute-wheel', mechanism: 'motion-works', side: 'dial', pos: at(minuteWheel, -1.42), explode: { dz: -3.2 }, material: 'steel', shape: { kind: 'pinion', leaves: MW.minutePinion, module: mMotion, length: 0.3 }, provenance: estimated(MOTION) },
  { id: 'hour-wheel', arbor: 'hour', mechanism: 'motion-works', side: 'dial', pos: at(center, -1.42), explode: { dz: -4.2 }, material: 'gilt', shape: { kind: 'wheel', teeth: MW.hourWheel, module: mMotion, thickness: 0.14, spokes: 4 }, provenance: estimated(MOTION) },
  { id: 'hour-hand', arbor: 'hour', mechanism: 'motion-works', side: 'dial', pos: at(center, DIAL - DIAL_THICKNESS - 0.69), explode: { dz: -6.2 }, material: 'blued', shape: { kind: 'hand', length: 6.8, width: 0.42, thickness: 0.18 }, provenance: sourced('sii-spec') },
  { id: 'date-driver', arbor: 'date-driver', rest: dateDriverRest, mechanism: 'calendar', side: 'dial', pos: at(dateDriver, -1.4), explode: { dz: -3.0 }, material: 'gilt', shape: { kind: 'date-driver', teeth: MW.dateDriver, module: mMotion, thickness: 0.14, fingerLength: 4.5 }, provenance: estimated(MOTION) },
  // rest π/2 turns today's date from 12 o'clock to the 3 o'clock window; its printed band is centred on the window SII
  // places 10.55 mm from the centre.
  { id: 'date-ring', rest: Math.PI / 2, mechanism: 'calendar', side: 'dial', pos: at(center, -1.66), explode: { dz: -1.6 }, material: 'plate', shape: { kind: 'date-ring', teeth: 31, innerRadius: 9.2, outerRadius: 11.9, thickness: 0.16 }, provenance: sourced('sii-spec') },
  { id: 'rotor', arbor: 'rotor', mechanism: 'automatic', side: 'back', pos: at(center, H.rotor), explode: { dz: 18 }, material: 'gilt', shape: { kind: 'rotor', radius: 13.2, hub: 1.2, thickness: 0.4 }, provenance: estimated('Oscillating weight on a ball bearing (SII); its gear ring drives the first reduction wheel. Thickness estimated.') },
  { id: 'rotor-gear', arbor: 'rotor', mechanism: 'automatic', side: 'back', pos: at(center, H.automatic), explode: { dz: 18 }, material: 'steel', shape: { kind: 'wheel', teeth: A.rotorGear, module: mAuto, thickness: 0.16, spokes: 0 }, provenance: estimated(AUTO, 'tmi-guide', 'wmj-magic-lever') },
  { id: 'first-reduction-wheel', arbor: 'first-reduction', mechanism: 'automatic', side: 'back', pos: at(first, H.automatic), explode: { dz: 15 }, material: 'gilt', shape: { kind: 'wheel', teeth: A.first, module: mAuto, thickness: 0.16, spokes: 0 }, provenance: estimated(AUTO, 'tmi-guide', 'wmj-magic-lever') },
  { id: 'eccentric', arbor: 'first-reduction', mechanism: 'automatic', side: 'back', pos: at(first, H.eccentric), explode: { dz: 15.5 }, material: 'steel', shape: { kind: 'eccentric', radius: 0.45, throw: THROW, thickness: 0.2 }, provenance: estimated(AUTO, 'tmi-guide', 'wmj-magic-lever') },
  { id: 'pawl-lever', rest: leverRest, mechanism: 'automatic', side: 'back', pos: at(pin, H.lever), explode: { dz: 16 }, material: 'steel', shape: { kind: 'pawl-lever', length: leverLength, reach: (A.second * mAuto) / 2, hole: 0.47, width: 0.36, thickness: 0.12 }, provenance: estimated(AUTO, 'tmi-guide', 'wmj-magic-lever') },
  { id: 'second-reduction-wheel', arbor: 'second-reduction', mechanism: 'automatic', side: 'back', pos: at(second, H.lever), explode: { dz: 16 }, material: 'gilt', shape: { kind: 'wheel', teeth: A.second, module: mAuto, thickness: 0.12, spokes: 0 }, provenance: estimated(AUTO, 'tmi-guide', 'wmj-magic-lever') },
  { id: 'second-reduction-pinion', arbor: 'second-reduction', mechanism: 'automatic', side: 'back', pos: at(second, H.secondPinion), explode: { dz: 16 }, material: 'steel', shape: { kind: 'pinion', leaves: A.secondPinion, module: mRatchet, length: 0.3 }, provenance: estimated(AUTO, 'tmi-guide', 'wmj-magic-lever') },
  {
    id: 'automatic-bridge', mechanism: 'frame', side: 'back', pos: at(center, H.autoBridge), explode: { dz: 17 }, material: 'rhodium',
    shape: { kind: 'bridge', thickness: 0.16, lobes: [{ ...first, r: 1.1 }, { ...second, r: 1.0 }, { x: 3.4, y: 1.4, r: 0.9 }, ...autoScrews.map((s) => ({ ...s, r: 0.85 }))], jewels: [first, second], screws: autoScrews },
    provenance: estimated('The automatic train bridge holds both reduction wheels (NH3 parts catalogue); outline estimated.'),
  },
  { id: 'stem', focus: 'stem', axis: 'x', mechanism: 'keyless', side: 'dial', pos: { x: (stemIn + stemOut) / 2, y: 0, z: STEM_Z }, explode: { dz: -3 }, material: 'steel', shape: { kind: 'stem', radius: 0.45, length: stemOut - stemIn }, provenance: sourced('sii-spec') },
  { id: 'winding-pinion', focus: 'stem', axis: 'x', mechanism: 'keyless', side: 'dial', pos: { x: 7.6, y: 0, z: STEM_Z }, explode: { dz: -3 }, material: 'steel', shape: { kind: 'wheel', teeth: 16, module: 0.1, thickness: 0.35, spokes: 0 }, provenance: estimated(KEYLESS) },
  { id: 'sliding-pinion', axis: 'x', mechanism: 'keyless', side: 'dial', pos: { x: 6.6, y: 0, z: STEM_Z }, explode: { dz: -3 }, material: 'steel', shape: { kind: 'wheel', teeth: 12, module: 0.1, thickness: 0.6, spokes: 0 }, provenance: estimated(KEYLESS) },
  { id: 'setting-wheel', mechanism: 'keyless', side: 'dial', pos: { x: 4.3, y: -1.5, z: -1.2 }, explode: { dz: -1.2 }, material: 'steel', shape: { kind: 'wheel', teeth: 14, module: 0.1, thickness: 0.16, spokes: 0 }, provenance: estimated(KEYLESS) },
];

const caliber: Caliber = {
  id: 'seiko-nh35a',
  name: 'Seiko NH35A',
  specs: {
    diameterMm: 27.4, heightMm: 5.32, jewels: 24, vph: 21600, powerReserveH: 41, hacking: true, quickDate: true,
    sourceIds: ['sii-spec', 'tmi-guide', 'calibercorner-nh35'],
  },
  exterior: { frontZ: DIAL - DIAL_THICKNESS, secondsZ: DIAL - DIAL_THICKNESS - 1.86, dialZ: DIAL - DIAL_THICKNESS / 2, dateWindow: { width: 2.9, height: 2.0 } },
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
    { type: 'mesh', a: 'rotor-gear', b: 'first-reduction-wheel' },
    { type: 'pawl', eccentric: 'eccentric', lever: 'pawl-lever', wheel: 'second-reduction-wheel' },
    { type: 'mesh', a: 'second-reduction-pinion', b: 'ratchet' },
    // SII: first pull-out stroke 0.399 mm, second 0.400 mm.
    { type: 'keyless', stem: 'stem', slidingPinion: 'sliding-pinion', windingPinion: 'winding-pinion', settingWheel: 'setting-wheel', pull: 0.4 },
  ],
  chapters: [
    { id: 'time', flow: ['barrel', 'center', 'third', 'fourth', 'escape', 'fork', 'balance'] },
    { id: 'hands', flow: [] },
    { id: 'date', flow: [] },
    { id: 'auto', flow: [] },
    { id: 'crown', flow: [] },
  ],
  tour: [
    { id: 'time-overview', chapter: 'time', focus: null, side: 'back', speed: 0.1, xray: false, rotor: 'hide', cameraOffset: [-20, 32, 36], stats: [{ label: 'jewels', value: '24' }, { label: 'vph', value: '21,600' }] },
    { id: 'time-barrel', chapter: 'time', focus: 'barrel', side: 'back', speed: 0.1, xray: false, rotor: 'hide', cameraOffset: [-14, 22, 24], stats: [{ label: 'teeth', value: '82' }, { label: 'powerReserve', value: '41 h' }] },
    { id: 'time-center', chapter: 'time', focus: 'center', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-12, 20, 22], stats: [{ label: 'teeth', value: '64' }, { label: 'rotation', value: '1 rph' }] },
    { id: 'time-third', chapter: 'time', focus: 'third', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-10, 18, 20], stats: [{ label: 'teeth', value: '60' }, { label: 'leaves', value: '8' }] },
    { id: 'time-fourth', chapter: 'time', focus: 'fourth', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-10, 17, 19], stats: [{ label: 'teeth', value: '84' }, { label: 'rotation', value: '1 rpm' }] },
    { id: 'time-escape', chapter: 'time', focus: 'escape', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-7, 12, 14], stats: [{ label: 'teeth', value: '15' }, { label: 'rotation', value: '12 rpm' }] },
    { id: 'time-fork', chapter: 'time', focus: 'fork', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-7, 12, 14], stats: [{ label: 'pallets', value: '2' }, { label: 'lift', value: '53°' }] },
    { id: 'time-balance', chapter: 'time', focus: 'balance', side: 'back', speed: 0.1, xray: false, rotor: 'hide', cameraOffset: [-12, 19, 21], stats: [{ label: 'vph', value: '21,600' }, { label: 'frequency', value: '3 Hz' }] },
    { id: 'hands-overview', chapter: 'hands', focus: null, side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-16, 30, 32], stats: [{ label: 'ratio', value: '12 : 1' }, { label: 'wheels', value: '3' }] },
    { id: 'hands-cannon', chapter: 'hands', focus: 'cannon', side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-9, 16, 17], stats: [{ label: 'teeth', value: '10' }, { label: 'rotation', value: '1 rph' }] },
    { id: 'hands-minute-wheel', chapter: 'hands', focus: 'minute-wheel', side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-9, 16, 17], stats: [{ label: 'teeth', value: '30 / 8' }, { label: 'reduction', value: '1 : 3' }] },
    { id: 'hands-hour', chapter: 'hands', focus: 'hour', side: 'dial', speed: 60, xray: false, rotor: 'hide', cameraOffset: [-10, 17, 18], stats: [{ label: 'teeth', value: '32' }, { label: 'rotation', value: '12 h' }] },
    { id: 'date-driver', chapter: 'date', focus: 'date-driver', side: 'dial', speed: 6000, xray: false, rotor: 'hide', cameraOffset: [-12, 20, 22], stats: [{ label: 'teeth', value: '64' }, { label: 'rotation', value: '24 h' }] },
    { id: 'date-ring', chapter: 'date', focus: 'date-ring', side: 'dial', speed: 6000, xray: false, rotor: 'hide', cameraOffset: [-14, 26, 28], stats: [{ label: 'teeth', value: '31' }, { label: 'step', value: '1 / day' }] },
    { id: 'auto-rotor', chapter: 'auto', focus: 'rotor', side: 'back', speed: 0.1, xray: false, rotor: 'show', cameraOffset: [-18, 30, 32], stats: [{ label: 'direction', value: '⟲ ⟳' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'auto-first-reduction', chapter: 'auto', focus: 'first-reduction', side: 'back', speed: 0.1, xray: false, rotor: 'xray', cameraOffset: [-12, 22, 24], stats: [{ label: 'teeth', value: '58' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'auto-pawl-lever', chapter: 'auto', focus: 'pawl-lever', side: 'back', speed: 0.1, xray: false, rotor: 'xray', cameraOffset: [-11, 20, 22], stats: [{ label: 'system', value: 'Magic Lever' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'auto-second-reduction', chapter: 'auto', focus: 'second-reduction', side: 'back', speed: 0.1, xray: false, rotor: 'xray', cameraOffset: [-10, 18, 20], stats: [{ label: 'teeth', value: '36 / 10' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'auto-ratchet', chapter: 'auto', focus: 'ratchet', side: 'back', speed: 0.1, xray: false, rotor: 'xray', cameraOffset: [-13, 24, 26], stats: [{ label: 'teeth', value: '72' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'crown-stem', chapter: 'crown', focus: 'stem', side: 'dial', speed: 0.1, xray: false, rotor: 'hide', ctl: 'crown', cameraOffset: [-10, 20, 22], stats: [{ label: 'position', value: 'live:crown' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'crown-sliding', chapter: 'crown', focus: 'sliding-pinion', side: 'dial', speed: 0.1, xray: false, rotor: 'hide', ctl: 'crown', cameraOffset: [-8, 15, 16], stats: [{ label: 'position', value: 'live:crown' }, { label: 'powerReserve', value: 'live:reserve' }] },
    { id: 'crown-hacking', chapter: 'crown', focus: 'balance', side: 'back', speed: 1, xray: false, rotor: 'hide', ctl: 'crown', cameraOffset: [-12, 19, 21], stats: [{ label: 'position', value: 'live:crown' }, { label: 'vph', value: '21,600' }] },
  ],
  sources: [
    { id: 'sii-spec', title: 'Cal. NH35A movement specification — SII Products / Time Module', url: 'https://gleave.london/content/TECH/Hattori%20NH35%20-%20Specification.pdf' },
    { id: 'tmi-guide', title: 'Cal. NH3 series technical guide & parts catalogue — Time Module', url: 'https://watch-help.ru/upload/iblock/f76/1wrteqbztomm6zep30qs6rl1babauix4/NH35_TG.pdf' },
    { id: 'calibercorner-nh35', title: 'Seiko (SII) Caliber NH35A — Caliber Corner', url: 'https://calibercorner.com/seiko-caliber-nh35a/' },
    { id: 'wmj-magic-lever', title: 'Automatic watches: Seiko 7S36B (Magic Lever) — Watchmaking Journey', url: 'https://watchmakingjourney.com/2015/10/19/automatic-watches-seiko-7s36b/' },
  ],
};

export default caliber;
