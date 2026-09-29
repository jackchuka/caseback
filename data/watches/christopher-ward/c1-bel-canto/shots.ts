import type { Shot } from '../../../../src/dev/shots';

// Camera values are aligned against the 41 mm case on the compare page (overlay mode). Only `front` is matched
// numerically; the angled shots have real perspective and are for judging features. The front photo shows the
// bracelet version; the case is the strap version's. On it the lugs sit 0.17 mm (5.8 px) left of the drum's centre, top
// and bottom alike, which a symmetric case cannot follow: `center` splits the difference, 2.9 px left of the drum's
// fitted centre (1489.8, 1510), so drum and lugs each miss by about 3 px.
export default [
  { id: 'front', file: 'front-azzurro-le.jpg', sourceUrl: 'https://www.christopherward.com/on/demandware.static/-/Sites-cw-master-catalog/default/images/WATCHES/C01-41APT1-T00B0-B0/C01-41APT1-T00B0-B0_Picture_1.jpg', view: 'front', time: '10:08:37', camera: { mmPerPx: 0.02941, center: [1486.9, 1510], rotation: [0, 0, 0] } },
  { id: 'crown-side', file: 'oblique-crown-side-viola.jpg', sourceUrl: 'https://www.christopherward.com/on/demandware.static/-/Sites-cw-master-catalog/default/images/WATCHES/C01-41APT0-T00P0-B0/C01-41APT0-T00P0-B0_Picture_6.jpg', view: 'three-quarter', time: '10:08:37', camera: { mmPerPx: 0.03, center: [1500, 1500], rotation: [0.05, 0.6, 0.1] } },
  { id: 'oblique-left', file: 'oblique-left-azzurro-le.jpg', sourceUrl: 'https://www.christopherward.com/on/demandware.static/-/Sites-cw-master-catalog/default/images/WATCHES/C01-41APT1-T00B0-B0/C01-41APT1-T00B0-B0_Picture_5.jpg', view: 'three-quarter', time: '10:08:37', camera: { mmPerPx: 0.03, center: [1500, 1500], rotation: [0.05, -0.6, 0.1] } },
  { id: 'caseback', file: 'caseback-viola.jpg', sourceUrl: 'https://www.christopherward.com/on/demandware.static/-/Sites-cw-master-catalog/default/images/WATCHES/C01-41APT0-T00P0-B0/C01-41APT0-T00P0-B0_Picture_7.jpg', view: 'three-quarter', time: '10:08:37', camera: { mmPerPx: 0.03, center: [1500, 1500], rotation: [0.3, Math.PI - 0.5, 0] } },
] satisfies Shot[];
