import type { Watch } from '../../../../src/model/watch';
const watch: Watch = {
  id: 'tudor/heritage-black-bay-79220b',
  brand: 'Tudor',
  model: 'Heritage Black Bay',
  reference: '79220B',
  caliberId: 'eta-2824-2',
  caliberNotes: 'The first Heritage Black Bay (ref. 79220) used an ETA 2824 base.',
  exterior: {
    case: { diameterMm: 41, thicknessMm: 13, lugWidthMm: 22, material: 'steel' },
    bezel: { kind: 'dive', color: '#1f3f8f' },
    crown: { diameterMm: 8, lengthMm: 4 },
    caseback: 'solid',
  },
  sources: [
    { id: 'chronotick', title: 'ETA 2824-2 — Chronotick (lists Tudor Black Bay Diver m79220b-0001)', url: 'https://chronotick.com/movement/eta-2824-2' },
    { id: 'fratello-79220b', title: 'Tudor Heritage Black Bay Blue, reference 79220B — Fratello', url: 'https://www.fratellowatches.com/tudor-heritage-black-bay-blue-52mondayz-46/' },
  ],
};
export default watch;
