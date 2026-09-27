import type { Watch } from '../../../../src/model/watch';
const watch: Watch = {
  id: 'sinn/556',
  brand: 'Sinn',
  model: '556',
  reference: '556',
  caliberId: 'eta-2824-2',
  caliberNotes: 'Earlier 556 production used the ETA 2824-2; later pieces moved to the Sellita SW200.',
  exterior: {
    case: { diameterMm: 38.5, thicknessMm: 11, lugWidthMm: 20, material: 'steel' },
    bezel: { kind: 'plain' },
    crown: { diameterMm: 6, lengthMm: 3 },
    caseback: 'solid',
  },
  sources: [
    { id: 'chronotick', title: 'ETA 2824-2 — Chronotick', url: 'https://chronotick.com/movement/eta-2824-2' },
    { id: 'watchcharts-556', title: 'Sinn 556i RS specifications — WatchCharts', url: 'https://watchcharts.com/listing/4780179-sinn-556i-rs-case-diameter-mm-38-5-case-thickness-mm-11-0' },
  ],
};
export default watch;
