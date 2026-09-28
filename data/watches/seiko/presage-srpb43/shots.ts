import type { Shot } from '../../../../src/dev/shots';

// Camera values are aligned against the 40.5 mm case on the compare page (overlay mode). Only `front` is matched
// numerically; the angled shots are for judging features.
export default [
  // Seiko's own flat catalogue shot: the case circle fits to 0.9 px, centred, lug tips equidistant, so no tilt.
  { id: 'front', file: 'seiko-global.png', sourceUrl: 'https://www.seikowatches.com/us-en/products/presage/srpb43j1', view: 'front', time: '10:08:37', camera: { mmPerPx: 0.064, center: [525.1, 514.2], rotation: [0, 0, 0] } },
  // Seiko USA's hero render, tilted about 30° toward 6 o'clock with some perspective: judged by features only.
  { id: 'front-angled', file: 'seikousa-1.png', sourceUrl: 'https://seikousa.com/products/srpb43', view: 'three-quarter', time: '10:08:37', camera: { mmPerPx: 0.0364, center: [555, 830], rotation: [-0.53, 0, 0] } },
  { id: 'three-quarter', file: 'abtw-9.jpg', sourceUrl: 'https://www.ablogtowatch.com/seiko-presage-automatic-srpb43-watch-review/', view: 'three-quarter', time: '10:09:31', camera: { mmPerPx: 0.044, center: [706, 612], rotation: [-0.4, 0, 0.05] } },
  { id: 'side', file: 'seikousa-2.png', sourceUrl: 'https://seikousa.com/products/srpb43', view: 'side', time: '10:08:37', camera: { mmPerPx: 0.0395, center: [1062, 141], rotation: [-Math.PI / 2 + 0.04, 0, Math.PI / 2] } },
] satisfies Shot[];
