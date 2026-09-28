import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Same studio as the approved prototype (v8): emissive softbox and strip planes aimed at the watch, prefiltered once.
// drei's Lightformer environment rendered noticeably dimmer and patchier than this for the same layout.
export function buildStudioEnvironments(gl: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(gl);
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x000000);
  const box = (w: number, h: number, x: number, y: number, z: number, color: number, intensity: number) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    studio.add(m);
  };
  box(18, 18, 0, 14, 0, 0xffffff, 1.9);
  box(5, 16, -12, 3, 4, 0xffffff, 1.2);
  box(5, 16, 12, 3, -4, 0xbfd0ff, 0.8);
  box(20, 2, 0, -2, -12, 0xffffff, 0.6);
  const dark = pmrem.fromScene(studio, 0.02).texture;
  const light = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  pmrem.dispose();
  return { dark, light };
}
