import type { Shot } from '../../../../src/dev/shots';

// Camera values are aligned against the 38.5 mm drum on the compare page (overlay mode). Only `front` is matched
// numerically; the angled shots have real perspective and are for judging features.
export default [
  { id: 'front', file: 'wg-2.jpg', sourceUrl: 'https://www.watchgecko.com/products/sinn-556-i-automatic-sports-watch-black-dial-solid-bracelet', view: 'front', time: '10:08:37', camera: { mmPerPx: 0.06604, center: [597.5, 600], rotation: [0, 0, 0] } },
  { id: 'three-quarter', file: 'wg-life3.jpg', sourceUrl: 'https://www.watchgecko.com/products/sinn-556-i-automatic-sports-watch-black-dial-solid-bracelet', view: 'three-quarter', time: '8:15:20', camera: { mmPerPx: 0.06, center: [520, 670], rotation: [0.6, -0.5, -0.5] } },
  { id: 'crown', file: 'wg-crown.jpg', sourceUrl: 'https://www.watchgecko.com/products/sinn-556-i-automatic-sports-watch-black-dial-solid-bracelet', view: 'three-quarter', time: '10:08:37', camera: { mmPerPx: 0.02, center: [300, 1100], rotation: [0.9, 0.3, 0.6] } },
] satisfies Shot[];
