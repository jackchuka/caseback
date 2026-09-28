import * as THREE from 'three';
import type { WatchExterior } from '../../model/watch';
import type { Layer } from '../../geometry/parts';
import type { CaseRadii } from '../caseGeometry';

export const DIAL_Z = -2.6; // between the date ring (−2.35) and the hour hand (−2.95)
// The window sits over the middle of the date ring's printed band ((9.3 + 12.3) / 2 mm) at 3 o'clock (+X).
export const DATE_WINDOW = { x: 10.8, width: 2.4, height: 1.8 };

export function dialRadius(r: CaseRadii) {
  return r.inner - 0.15;
}

export function dialTextureSpec(e: WatchExterior) {
  const arabic = e.dial.indices === 'arabic-24';
  return {
    // A date window at 3 o'clock replaces the printed 3, as on the real dial.
    numerals: arabic ? ['12', '1', '2', e.dial.dateWindow ? '' : '3', '4', '5', '6', '7', '8', '9', '10', '11'] : [],
    ring24: arabic,
    // Field dials carry 5-minute numerals on the outer railroad track.
    outerMinutes: arabic,
    minuteTrack: true,
  };
}

export function dialLayers(e: WatchExterior, r: CaseRadii): Layer[] {
  const rad = dialRadius(r);
  const outline = new THREE.Shape();
  outline.absarc(0, 0, rad, 0, Math.PI * 2, false);
  if (e.dial.dateWindow) {
    const { x, width: w, height: h } = DATE_WINDOW;
    const hole = new THREE.Path();
    hole.moveTo(x - w / 2, -h / 2);
    hole.lineTo(x - w / 2, h / 2);
    hole.lineTo(x + w / 2, h / 2);
    hole.lineTo(x + w / 2, -h / 2);
    hole.closePath();
    outline.holes.push(hole);
  }
  const disc = new THREE.ShapeGeometry(outline, 128);
  // ShapeGeometry UVs are raw XY; remap to 0..1 across the disc so the painted dial lines up.
  const pos = disc.getAttribute('position');
  const uv = disc.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (2 * rad) + 0.5, pos.getY(i) / (2 * rad) + 0.5);
  // Faces −Z (towards the front); the printed texture is painted by Exterior.
  disc.rotateX(Math.PI).translate(0, 0, DIAL_Z);
  const layers: Layer[] = [{ geometry: disc, material: 'dial' }];
  if (e.dial.indices === 'diver-dots') {
    // Applied indices as on the reference photos: lume in a polished metal surround, dots about 0.075 of the dial
    // radius across, 3/6/9 bars about 0.3 long, a triangle at 12, all centred at 0.78 of the radius.
    const ri = rad * 0.78;
    const dot = rad * 0.075;
    const bar = { w: rad * 0.09, l: rad * 0.3 };
    const tri = rad * 0.13;
    const rim = 0.18;
    // The 12 o'clock triangle points toward the centre, as on divers' dials.
    const shape = (h: number, grow: number, depth: number) =>
      h === 0
        ? new THREE.CylinderGeometry(tri + grow, tri + grow, depth, 3).rotateX(Math.PI / 2).rotateZ(Math.PI)
        : h % 3 === 0
          ? new THREE.BoxGeometry(bar.w + 2 * grow, bar.l + 2 * grow, depth)
          : new THREE.CylinderGeometry(dot + grow, dot + grow, depth, 40).rotateX(Math.PI / 2);
    for (let h = 0; h < 12; h++) {
      const a = (h / 12) * Math.PI * 2;
      const at = (g: THREE.BufferGeometry, z: number) => g.rotateZ(-a).translate(Math.sin(a) * ri, -Math.cos(a) * ri, z);
      layers.push({ geometry: at(shape(h, 0, 0.3), DIAL_Z - 0.18), material: 'lume' });
      layers.push({ geometry: at(shape(h, rim, 0.24), DIAL_Z - 0.12), material: 'steel' });
    }
  }
  return layers;
}
