import type { Shot } from '../../../../src/dev/shots';

// Camera values are aligned against the 38 mm case drum on the compare page (overlay mode). Only `front` is matched
// numerically; the angled shots (fitted to the numerals, date window and crown by least squares; the photos have
// some perspective, so ~5–13 px residuals remain) are for judging features. The front photo is Hamilton's own straight-on render,
// tilted slightly about X (the drum reads 222 px tall but 225 px wide and the 6 o'clock lugs reach 0.9 mm further).
export default [
  { id: 'front', file: 'teddy-front.jpg', sourceUrl: 'https://teddybaldassarre.com/products/khaki-field-auto-silver-dial', view: 'front', time: '10:08:37', camera: { mmPerPx: 0.08447, center: [475.6, 492], rotation: [0.06, 0, 0] } },
  { id: 'three-quarter', file: 'gnomon-3.jpg', sourceUrl: 'https://www.gnomonwatches.com/products/khaki-field-automatic-silver-38-brown-leather-ref-h70455553', view: 'three-quarter', time: '10:10:34', camera: { mmPerPx: 0.0671, center: [509, 359], rotation: [-0.326, 0.278, -0.162] } },
  { id: 'crown-low', file: 'gnomon-5.jpg', sourceUrl: 'https://www.gnomonwatches.com/products/khaki-field-automatic-silver-38-brown-leather-ref-h70455553', view: 'three-quarter', time: '10:09:37', camera: { mmPerPx: 0.0674, center: [487, 335], rotation: [-0.889, 0.33, 0.855] } },
] satisfies Shot[];
