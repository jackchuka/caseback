import type { Shot } from '../../../../src/dev/shots';

// Camera values are aligned on the compare page (overlay mode). Only `front` is matched numerically: it is the
// photo the plan was traced on (0.038 mm/px, pivot at 999, 956). The angled shots are for judging features.
export default [
  { id: 'front', file: 'monica-front.jpg', sourceUrl: 'https://monicajewelers.com/products/hamilton-xxl-automatic-ventura-h24655331', view: 'front', time: '10:09:37', camera: { mmPerPx: 45.5 / 1198, center: [999, 956], rotation: [0, 0, 0] } },
  { id: 'wrist', file: 'timescape-wrist.jpg', sourceUrl: 'https://www.timescapeusa.com/products/hamilton-ventura-xxl-auto-h24655331', view: 'three-quarter', time: '10:08:10', camera: { mmPerPx: 0.066, center: [915, 757], rotation: [-0.42, -0.42, 2.36] } },
  { id: 'back', file: 'monica-back.jpg', sourceUrl: 'https://monicajewelers.com/products/hamilton-xxl-automatic-ventura-h24655331', view: 'three-quarter', time: '10:08:37', camera: { mmPerPx: 0.042, center: [560, 640], rotation: [0.3, Math.PI - 0.35, 0.15] } },
  { id: 'side-back', file: 'monica-side.jpg', sourceUrl: 'https://monicajewelers.com/products/hamilton-xxl-automatic-ventura-h24655331', view: 'three-quarter', time: '10:08:37', camera: { mmPerPx: 0.06, center: [420, 560], rotation: [0.1, Math.PI - 0.95, 0.05] } },
] satisfies Shot[];
