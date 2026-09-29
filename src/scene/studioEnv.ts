import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// A dome shaded from `top` overhead through `horizon` to `bottom` underneath (linear radiance).
function dome(top: number, horizon: number, bottom: number) {
  const g = new THREE.SphereGeometry(40, 32, 16);
  const pos = g.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 40;
    const v = y >= 0 ? horizon + (top - horizon) * Math.sqrt(y) : horizon + (bottom - horizon) * Math.sqrt(-y);
    colors.set([v, v, v * 1.03], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }));
}

export const DOME = { dark: [0.45, 0.15, 0.01] as const };

// Same studio as the approved prototype (v8): emissive softbox and strip planes aimed at the watch, prefiltered once.
// drei's Lightformer environment rendered noticeably dimmer and patchier than this for the same layout.
export function buildStudioEnvironments(gl: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(gl);
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x000000);
  studio.add(dome(...DOME.dark));
  const box = (w: number, h: number, x: number, y: number, z: number, color: number, intensity: number, into: THREE.Scene = studio) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    into.add(m);
  };
  box(18, 18, 0, 14, 0, 0xffffff, 1.9);
  box(5, 16, -12, 3, 4, 0xffffff, 1.2);
  box(5, 16, 12, 3, -4, 0xbfd0ff, 0.8);
  box(20, 2, 0, -2, -12, 0xffffff, 0.6);
  // A ring of narrow strips around the horizon, with dark gaps between them: case flanks and bracelet sides face
  // sideways, and with only overhead boxes they mirrored black. Gaps keep the steel contrasty instead of flat grey.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    box(2.2, 7, Math.cos(a) * 15, 2, Math.sin(a) * 15, 0xffffff, i % 2 ? 0.9 : 0.55);
  }
  const dark = pmrem.fromScene(studio, 0.02).texture;
  // The room alone is evenly soft, which leaves polished steel matte-looking; a few small, hot strips give it glints.
  const room = new RoomEnvironment();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    box(1.2, 5, Math.cos(a) * 12, 3, Math.sin(a) * 12, 0xffffff, i % 2 ? 5 : 3, room);
  }
  box(6, 1.2, 0, 13, 0, 0xffffff, 6, room);
  const light = pmrem.fromScene(room, 0.03).texture;
  pmrem.dispose();
  return { dark, light };
}
