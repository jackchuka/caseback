import type { Watch } from '../../../../src/model/watch';
const watch: Watch = {
  id: 'sinn/556',
  brand: 'Sinn',
  model: '556',
  reference: '556',
  caliberId: 'eta-2824-2',
  caliberNotes: 'Listed with the ETA 2824-2 (556 No Date, 38.5 mm).',
  exterior: {
    case: { diameterMm: 38.5, thicknessMm: 11, lugWidthMm: 20, material: 'steel' },
    bezel: { kind: 'plain' },
    crown: { diameterMm: 6, lengthMm: 3 },
    caseback: 'solid',
  },
  sources: [
    { id: 'chronotick', title: 'ETA 2824-2 — Chronotick', url: 'https://chronotick.com/movement/eta-2824-2' },
    { id: 'sinn-556i', title: 'Sinn 556 I — Sinn Spezialuhren', url: 'https://www.sinn.de/en/watches/556-i.html' },
  ],
};
export default watch;
