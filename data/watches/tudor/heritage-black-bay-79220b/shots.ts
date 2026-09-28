import type { Shot } from '../../../../src/dev/shots';

// Camera values are aligned against the 41 mm bezel on the compare page (overlay mode). Only `front` is matched
// numerically; the angled shots have real perspective and are for judging features.
export default [
  { id: 'front', file: 'bobs-126699s.jpg', sourceUrl: 'https://www.bobswatches.com/tudor/tudor-heritage-black-bay-79220b-stainless-steel.html', view: 'front', time: '11:40:00', camera: { mmPerPx: 0.1669, center: [450, 431], rotation: [0, 0, 0] } },
  { id: 'three-quarter', file: 'bobs-1103.jpg', sourceUrl: 'https://www.bobswatches.com/tudor/tudor-heritage-black-bay-79220b-stainless-steel.html', view: 'three-quarter', time: '9:45:00', camera: { mmPerPx: 0.1556, center: [285, 355], rotation: [0.1, 0.75, 0] } },
  { id: 'crown-low', file: 'Tudor-Black-Bay-Blue-13.jpg', sourceUrl: 'https://www.ablogtowatch.com/tudor-heritage-black-bay-blue-79220b-watch-2014/', view: 'three-quarter', time: '8:06:00', camera: { mmPerPx: 0.096, center: [436, 206], rotation: [-0.95, 0.35, 0] } },
] satisfies Shot[];
