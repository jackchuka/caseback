import type { Shot } from '../../../../src/dev/shots';

// Camera values are aligned against the 38.5 mm drum on the compare page (overlay mode). Only `front` is matched
// numerically; the angled shots have real perspective and are for judging features.
export default [
  { id: 'front', file: 'wg-2.jpg', sourceUrl: 'https://www.watchgecko.com/products/sinn-556-i-automatic-sports-watch-black-dial-solid-bracelet', view: 'front', time: '10:08:37', camera: { mmPerPx: 0.06604, center: [599, 600], rotation: [0, 0, -0.004] } },
  { id: 'three-quarter', file: 'wg-life3.jpg', sourceUrl: 'https://www.watchgecko.com/products/sinn-556-i-automatic-sports-watch-black-dial-solid-bracelet', view: 'three-quarter', time: '10:10:33', camera: { mmPerPx: 0.084, center: [515, 675], rotation: [0.3, 0, -1.43] } },
  { id: 'crown', file: 'wg-crown.jpg', sourceUrl: 'https://www.watchgecko.com/products/sinn-556-i-automatic-sports-watch-black-dial-solid-bracelet', view: 'three-quarter', time: '10:08:37', camera: { mmPerPx: 0.024, center: [545, 780], rotation: [0.95, 0, -1.43] } },
] satisfies Shot[];
