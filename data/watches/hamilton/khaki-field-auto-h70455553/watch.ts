import type { Watch } from '../../../../src/model/watch';
const watch: Watch = {
  id: 'hamilton/khaki-field-auto-h70455553',
  brand: 'Hamilton',
  model: 'Khaki Field Auto',
  reference: 'H70455553',
  caliberId: 'eta-2824-2',
  caliberNotes: 'Hamilton calibre H-10 is Hamilton\'s version of the ETA C07.611, a 2824 derivative slowed to 21,600 vph for an 80 h power reserve.',
  movement: { name: 'Hamilton H-10', vph: 21600, powerReserveH: 80, sourceIds: ['watchbase-h10', 'calibercorner-h10'] },
  exterior: {
    case: { diameterMm: 38, thicknessMm: 11, lugWidthMm: 20, material: 'steel' },
    bezel: { kind: 'plain' },
    crown: { diameterMm: 6.5, lengthMm: 3.5 },
    caseback: 'display',
  },
  sources: [
    { id: 'hamilton-h70455553', title: 'Khaki Field Auto H70455553 — Hamilton', url: 'https://www.hamiltonwatch.com/en-us/h70455553-khaki-field-auto.html' },
    { id: 'watchbase-h10', title: 'Hamilton caliber H-10 — WatchBase', url: 'https://watchbase.com/hamilton/caliber/h-10' },
    { id: 'calibercorner-h10', title: 'Hamilton Caliber H-10 — Caliber Corner', url: 'https://calibercorner.com/hamilton-caliber-h-10/' },
    { id: 'watchmaxx-h70455553', title: 'Hamilton Khaki Field Auto 38mm H70455553 — WatchMaxx', url: 'https://www.watchmaxx.com/hamilton-watch-h70455553' },
  ],
};
export default watch;
