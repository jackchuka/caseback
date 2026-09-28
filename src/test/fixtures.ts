import type { Caliber, Part } from '../model/schema';

const est = { confidence: 'estimated' as const, sourceIds: [] };
const base = { mechanism: 'going-train' as const, side: 'back' as const, explode: { dz: 1 }, material: 'gilt' as const, provenance: est };

export function miniCaliber(): Caliber {
  const parts: Part[] = [
    { ...base, id: 'w1', arbor: 'a', pos: { x: 0, y: 0, z: 1 }, shape: { kind: 'wheel', teeth: 120, module: 0.1, thickness: 0.2, spokes: 4 } },
    { ...base, id: 'p2', arbor: 'esc', pos: { x: 6.5, y: 0, z: 1 }, shape: { kind: 'pinion', leaves: 10, module: 0.1, length: 0.6 } },
    { ...base, id: 'escw', arbor: 'esc', mechanism: 'escapement', pos: { x: 6.5, y: 0, z: 0.5 }, shape: { kind: 'escape-wheel', teeth: 20, outerRadius: 1.4, thickness: 0.15 } },
    { ...base, id: 'fork', mechanism: 'escapement', pos: { x: 8, y: 0, z: 0.5 }, shape: { kind: 'pallet-fork', span: 2.8, length: 3, thickness: 0.14 } },
    { ...base, id: 'bal', mechanism: 'regulator', pos: { x: 12, y: 0, z: 0.5 }, shape: { kind: 'balance', radius: 4, rimThickness: 0.2, arms: 2 } },
    { ...base, id: 'plate', mechanism: 'frame', explode: { dz: -2 }, pos: { x: 0, y: 0, z: -0.5 }, shape: { kind: 'plate', radius: 16, thickness: 1 } },
    { ...base, id: 'hour-hand', mechanism: 'motion-works', side: 'dial', pos: { x: 0, y: 0, z: -2.95 }, shape: { kind: 'hand', length: 6.2, width: 0.42, thickness: 0.08 } },
  ];
  return {
    id: 'mini',
    name: 'Mini',
    specs: { diameterMm: 32, heightMm: 4, jewels: 17, vph: 28800, powerReserveH: 40, hacking: true, quickDate: false, sourceIds: ['s1'] },
    exterior: { frontZ: -2.8, secondsZ: -3.5 },
    parts,
    couplings: [
      { type: 'mesh', a: 'w1', b: 'p2' },
      { type: 'escapement', balance: 'bal', fork: 'fork', escapeWheel: 'escw' },
    ],
    chapters: [{ id: 'time', flow: ['a', 'esc', 'fork', 'bal'] }],
    tour: [
      { id: 'time-overview', chapter: 'time', focus: null, side: 'back', speed: 0.1, xray: false, rotor: 'hide', cameraOffset: [-20, 32, 36], stats: [] },
      { id: 'time-a', chapter: 'time', focus: 'a', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-10, 18, 20], stats: [{ label: 'teeth', value: '120' }] },
      { id: 'time-esc', chapter: 'time', focus: 'esc', side: 'back', speed: 0.1, xray: true, rotor: 'hide', cameraOffset: [-7, 12, 14], stats: [] },
    ],
    sources: [{ id: 's1', title: 'Source 1', url: 'https://example.com/s1' }],
  };
}
