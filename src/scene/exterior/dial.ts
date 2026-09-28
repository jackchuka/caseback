import * as THREE from 'three';
import type { WatchExterior } from '../../model/watch';
import type { Layer } from '../../geometry/parts';
import type { CaseRadii } from '../caseGeometry';

export const DIAL_Z = -2.6; // between the date ring (−2.35) and the hour hand (−2.95)

export function dialRadius(r: CaseRadii) {
  return r.inner - 0.15;
}

export function dialTextureSpec(e: WatchExterior) {
  const arabic = e.dial.indices === 'arabic-24';
  return {
    numerals: arabic ? ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'] : [],
    ring24: arabic,
    minuteTrack: true,
  };
}

export function dialLayers(e: WatchExterior, r: CaseRadii): Layer[] {
  const rad = dialRadius(r);
  // Faces −Z (towards the front); the printed texture is painted by Exterior.
  const disc = new THREE.CircleGeometry(rad, 128).rotateX(Math.PI).translate(0, 0, DIAL_Z);
  const layers: Layer[] = [{ geometry: disc, material: 'dial' }];
  if (e.dial.indices === 'diver-dots') {
    const ri = rad * 0.8;
    for (let h = 0; h < 12; h++) {
      const a = (h / 12) * Math.PI * 2;
      const x = Math.sin(a) * ri;
      const y = -Math.cos(a) * ri;
      const g =
        h === 0
          ? new THREE.ConeGeometry(0.9, 0.2, 3).rotateX(Math.PI / 2)
          : h % 3 === 0
            ? new THREE.BoxGeometry(0.7, 2.0, 0.2).rotateZ(-a)
            : new THREE.CylinderGeometry(0.55, 0.55, 0.2, 32).rotateX(Math.PI / 2);
      layers.push({ geometry: g.translate(x, y, DIAL_Z - 0.12), material: 'lume' });
    }
  }
  return layers;
}
