import type { Shot } from '../../../../src/dev/shots';

// Camera values are aligned against the 41 mm bezel on the compare page (overlay mode). Only `front` is matched
// numerically; the angled shots have real perspective and are for judging features.
export default [
  // Sinn's flat catalogue shot: the bezel circle fits to 3 px (its coin edge), centred.
  { id: 'front', file: 'SINN_103-St-Sa_F_LB.jpg', sourceUrl: 'https://definewatches.com.au/shop/sinn/instrument-chronographs/103-st-sa/', view: 'front', time: '10:10:37', camera: { mmPerPx: 0.0734, center: [513.2, 539.7], rotation: [0, 0, 0] } },
  { id: 'side', file: '103-St-Sa-Seite.jpg', sourceUrl: 'https://sg-watches.de/en/artikel/sinn-103-st-sa-ref-103-061-2/', view: 'side', time: '10:10:37', camera: { mmPerPx: 0.0657, center: [1165, 825], rotation: [-Math.PI / 2 + 0.03, 0, Math.PI / 2] } },
  { id: 'three-quarter', file: 'p-49076-103-St-Sa-Classic-Pilot-Diagonal.jpg', sourceUrl: 'https://definewatches.com.au/shop/sinn/instrument-chronographs/103-st-sa/', view: 'three-quarter', time: '10:09:30', camera: { mmPerPx: 0.066, center: [488, 428], rotation: [0.05, 0.35, 0.18] } },
  { id: 'crown', file: 'p-49076-103-St-Sa-Classic-Pilot-Crown-Shot.jpg', sourceUrl: 'https://definewatches.com.au/shop/sinn/instrument-chronographs/103-st-sa/', view: 'three-quarter', time: '10:09:30', camera: { mmPerPx: 0.051, center: [455, 530], rotation: [0.05, 0.75, 0.12] } },
] satisfies Shot[];
