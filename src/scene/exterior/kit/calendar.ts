import * as THREE from 'three';
import { dateNumbers, dayNames, type Print } from '../../textures';

export const WHITE_ON_BLACK = { ground: '#0c0c0d', ink: '#f1f1ee' } as const satisfies Print;

// A calendar disc printed the watch's own way. The print's own emission keeps the figures readable through a window
// that the studio lights only faintly.
const disc = (map: THREE.Texture) => {
  map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  return new THREE.MeshPhysicalMaterial({ map, roughness: 0.6, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.3 });
};

export const dateDisc = (print: Print) => disc(dateNumbers(31, print));
export const dayDisc = (print: Print) => disc(dayNames(print));
