import type { Shot } from '../../../../src/dev/shots';

// Camera values are aligned against the 41 mm bezel on the compare page (overlay mode). Only `front` is matched
// numerically; the angled shots have real perspective and are for judging features. The front photo is not square
// on: the watch lies tilted toward 6 o'clock (the bezel reads 235 px tall but 241 px wide), hence its X rotation.
export default [
  { id: 'front', file: 'bobs-126699s.jpg', sourceUrl: 'https://www.bobswatches.com/tudor/tudor-heritage-black-bay-79220b-stainless-steel.html', view: 'front', time: '12:40:08', camera: { mmPerPx: 0.1697, center: [450, 437], rotation: [-0.3, 0, 0] } },
  { id: 'three-quarter', file: 'bobs-1103.jpg', sourceUrl: 'https://www.bobswatches.com/tudor/tudor-heritage-black-bay-79220b-stainless-steel.html', view: 'three-quarter', time: '9:45:00', camera: { mmPerPx: 0.109, center: [265, 382], rotation: [0.1, 0.8, 0] } },
  { id: 'crown-low', file: 'Tudor-Black-Bay-Blue-13.jpg', sourceUrl: 'https://www.ablogtowatch.com/tudor-heritage-black-bay-blue-79220b-watch-2014/', view: 'three-quarter', time: '8:06:00', camera: { mmPerPx: 0.077, center: [473, 251], rotation: [-0.85, 0.35, 1.2] } },
] satisfies Shot[];
