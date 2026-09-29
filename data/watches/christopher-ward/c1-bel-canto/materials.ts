import * as THREE from 'three';
import { canvasTexture } from '../../../../src/scene/exterior/kit/canvas';
import { glass } from '../../../../src/scene/exterior/kit/glass';
import { withPolish } from '../../../../src/scene/exterior/kit/polish';
import { lumeMaterial } from '../../../../src/scene/lume';
import { paintDial, paintDialGrain } from './dial';
import { soundwaveArcs } from './caseback';
import { P } from './params';
import { paintStrap } from './strap';

// Grade 5 titanium: a little greyer and darker than steel.
const TITANIUM = 0xc9ccd0;

// The caseback plate's outer face, seen through the cylinder cap's UVs (the disc mapped onto the unit square): light
// where the face is flat, dark in the stamped grooves. Used as colour and bump, so the grooves read as pressed in.
// Each groove is a crescent: widest mid-arc, tapering to its ends.
function paintSoundwave() {
  const size = 1024;
  const px = size / (2 * P.caseback.plate);
  return canvasTexture(size, size, (g) => {
    g.fillStyle = '#d8d8d8';
    g.fillRect(0, 0, size, size);
    g.strokeStyle = '#6a6a6a';
    g.lineCap = 'round';
    for (const a of soundwaveArcs()) {
      const mid = (a.from + a.to) / 2, half = (a.to - a.from) / 2;
      for (let i = 0; i < 8; i++) {
        const extent = 1 - (0.5 * i) / 7;
        g.lineWidth = (0.3 + (0.5 * i) / 7) * px;
        g.beginPath();
        g.arc(size / 2, size / 2, a.radius * px, mid - half * extent, mid + half * extent);
        g.stroke();
      }
    }
  }, 8);
}

export function belCantoMaterials(): Record<string, () => THREE.Material> {
  return {
    // Brushed all over but for the step, the flange and the lug chamfers; the per-vertex polish attribute carries them.
    case: () => withPolish(new THREE.MeshPhysicalMaterial({ color: TITANIUM, metalness: 1, roughness: 0.38, envMapIntensity: 1.4 }), 0.07),
    polished: () => new THREE.MeshPhysicalMaterial({ color: TITANIUM, metalness: 1, roughness: 0.06, envMapIntensity: 1.4 }),
    crystal: () => glass(1.5),
    // The module plate: blue sunray (photo:front), part metal so the studio's lights sweep across it, brushed along the
    // radii so the sheen stretches round the dial. The chime marks are painted into it.
    dial: () => new THREE.MeshPhysicalMaterial({ map: paintDial(), metalness: 0.45, roughness: 0.3, anisotropy: 0.85, anisotropyMap: paintDialGrain(), envMapIntensity: 1.2 }),
    // Separate from the movement lume so it fades with the dial; same recipe so indexes and hands match.
    'dial-lume': () => lumeMaterial(),
    // The chapter ring: brushed silver, lighter than the polished titanium (photo:front).
    'chapter-ring': () => new THREE.MeshPhysicalMaterial({ color: P.ringColor, metalness: 0.6, roughness: 0.42, envMapIntensity: 1.3 }),
    // The raised batons: polished, but pale enough to read bright against the ring as they do in the photos.
    index: () => new THREE.MeshPhysicalMaterial({ color: 0xeef0f2, metalness: 0.75, roughness: 0.18, envMapIntensity: 1.5 }),
    // The chapter ring's minute track.
    'dial-print': () => new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.6 }),
    strap: () => new THREE.MeshPhysicalMaterial({ map: paintStrap(), roughness: 0.6, sheen: 0.4, sheenColor: new THREE.Color(0x44557a) }),
    'strap-edge': () => new THREE.MeshPhysicalMaterial({ color: 0x1a2231, roughness: 0.5 }),
    'strap-lining': () => new THREE.MeshPhysicalMaterial({ color: P.liningColor, roughness: 0.8 }),
    'caseback-metal': () => new THREE.MeshPhysicalMaterial({ color: TITANIUM, metalness: 1, roughness: 0.32, clearcoat: 0.15, clearcoatRoughness: 0.3 }),
    'caseback-wave': () => {
      const tex = paintSoundwave();
      return new THREE.MeshPhysicalMaterial({ color: TITANIUM, map: tex, bumpMap: tex, bumpScale: 1.5, metalness: 1, roughness: 0.34 });
    },
  };
}
