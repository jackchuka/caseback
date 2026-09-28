import type { Shot } from '../../../../src/dev/shots';

// Camera values are aligned against the 40.5 mm case on the compare page (overlay mode). Only `front` is matched
// numerically; the angled shots are for judging features.
export default [
  { id: 'front', file: 'seikousa-1.png', sourceUrl: 'https://seikousa.com/products/srpb43', view: 'front', time: '10:08:37', camera: { mmPerPx: 0.0364, center: [555, 830], rotation: [-0.53, 0, 0] } },
  { id: 'three-quarter', file: 'abtw-9.jpg', sourceUrl: 'https://www.ablogtowatch.com/seiko-presage-automatic-srpb43-watch-review/', view: 'three-quarter', time: '10:09:31', camera: { mmPerPx: 0.0456, center: [706, 612], rotation: [-0.25, 0, 0] } },
  { id: 'side', file: 'seikousa-2.png', sourceUrl: 'https://seikousa.com/products/srpb43', view: 'side', time: '10:08:37', camera: { mmPerPx: 0.0395, center: [1062, 141], rotation: [-Math.PI / 2 + 0.04, 0, Math.PI / 2] } },
] satisfies Shot[];
