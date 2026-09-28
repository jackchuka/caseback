import type { Watch } from '../../../../src/model/watch';
const watch: Watch = {
  id: 'sinn/556',
  brand: 'Sinn',
  model: '556',
  reference: '556',
  caliberId: 'eta-2824-2',
  caliberNotes: 'Refers to 556 No Date pieces with the ETA 2824-2; current 556 I production uses the Sellita SW200-1.',
  exterior: {
    case: { diameterMm: 38.5, thicknessMm: 11, lugToLugMm: 45.7, lugWidthMm: 20, material: 'steel', finish: { top: 'brushed', flank: 'brushed' }, flank: 'straight', chamferMm: 0.7, lugs: { widthMm: 3.4, taper: 0.7, drilled: true } },
    bezel: { kind: 'plain', widthMm: 1.5, profile: 'rounded', finish: 'brushed' },
    crown: { diameterMm: 6, lengthMm: 3, tube: false, guards: false },
    crystal: { domeMm: 0.3 },
    dial: { color: '#141416', finish: 'matte', indices: 'bars-minute', indexColor: '#f2f2f2', lume: '#f2f2f2', dateWindow: false },
    hands: { style: 'baton', color: 'silver', seconds: true },
    strap: { kind: 'bracelet', color: '#bfc2c6' },
    caseback: 'solid',
  },
  sources: [
    { id: 'hiconsumption-556i', title: 'Sinn 556i review — HiConsumption', url: 'https://hiconsumption.com/watches/sinn-556i-watch-review/' },
    { id: 'chronotick', title: 'ETA 2824-2 — Chronotick', url: 'https://chronotick.com/movement/eta-2824-2' },
    { id: 'sinn-556i', title: 'Sinn 556 I — Sinn Spezialuhren', url: 'https://www.sinn.de/en/watches/556-i.html' },
  ],
};
export default watch;
