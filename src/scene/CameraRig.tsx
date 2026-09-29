import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Caliber } from '../model/schema';
import { appStore, useApp } from '../state/app';
import type { AppState } from '../state/store';
import type { CaseBounds } from './exterior/caseBounds';
import { focusCenterLocal, toWorld, type Side, type V3 } from './focus';
import { frameFor, viewOffset, type Frame } from './framing';
import { occluders } from '../state/occluders';
import { flipGroup } from './flip';
import { registry } from './registry';
import { shotFor } from './shots';
import { MAX_FRAME } from './simClock';
import { Tween } from './tween';

declare global {
  interface Window {
    __caseback?: { target(): V3; state(): AppState; project(focus: string): [number, number]; flip(): number; angle(id: string): number; hits(x: number, y: number): string[]; camera(): V3; subject(): [number, number, number, number]; quat(): number[]; enabled(): boolean; three(): { scene: THREE.Scene; gl: THREE.WebGLRenderer } };
  }
}

const sideOf = (): Side => ((flipGroup.current?.rotation.x ?? 0) > Math.PI / 2 ? 'dial' : 'back');

// Points around the case's rim, front and back, in world space for either side up.
function caseRing({ radius, front, back }: CaseBounds, side: Side): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  for (const z of [front, back]) {
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      out.push(new THREE.Vector3(...toWorld([radius * Math.cos(a), radius * Math.sin(a), z], side)));
    }
  }
  return out;
}

const tmp = new THREE.Vector3();

// subject: the case, which the intro shrinks to fit beside its text.
export function CameraRig({ caliber, watchFront = false, subject }: { caliber: Caliber; watchFront?: boolean; subject: CaseBounds }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const mode = useApp((s) => s.mode);
  const stepIndex = useApp((s) => s.stepIndex);
  const freeSide = useApp((s) => s.freeSide);
  const tween = useRef<Tween | null>(null);
  const rings = useMemo(() => ({ back: caseRing(subject, 'back'), dial: caseRing(subject, 'dial') }), [subject]);
  const frame = useRef<Frame | null>(null);
  const reach = useRef({ x: 0, y: 0 });
  const applied = useRef({ w: 0, h: 0, dx: NaN, dy: NaN, scale: NaN });

  // Only a new shot (mode, step, side) starts a flight; resizes, scene or hook changes must never re-fly the camera.
  useEffect(() => {
    if (!controls) return;
    tween.current = new Tween(camera.position.toArray(), controls.target.toArray(), shotFor(caliber, mode, stepIndex, freeSide, watchFront), flipGroup.current?.rotation.x ?? 0);
  }, [caliber, camera, controls, mode, stepIndex, freeSide, watchFront]);

  useEffect(() => {
    if (!controls) return;
    window.__caseback = {
      target: () => controls.target.toArray(),
      state: () => appStore().getState(),
      project: (focus) => {
        const side = (flipGroup.current?.rotation.x ?? 0) > Math.PI / 2 ? 'dial' : 'back';
        const v = new THREE.Vector3(...toWorld(focusCenterLocal(caliber, focus, side), side)).project(camera);
        return [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
      },
      flip: () => flipGroup.current?.rotation.x ?? 0,
      camera: () => camera.position.toArray(),
      subject: () => {
        const ps = rings[sideOf()].map((p) => p.clone().project(camera));
        const xs = ps.map((v) => ((v.x + 1) / 2) * size.width), ys = ps.map((v) => ((1 - v.y) / 2) * size.height);
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      },
      quat: () => camera.quaternion.toArray().map((v) => +v.toFixed(4)),
      enabled: () => controls.enabled,
      three: () => ({ scene, gl }),
      hits: (x, y) => {
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1), camera);
        const named = (o: THREE.Object3D | null): string => (!o ? '' : o.name || named(o.parent));
        // three.js raycasts ignore visibility, so report only objects whose whole ancestor chain is rendered. Deep enough
        // that the hands (two layers each) passing over a probe never push the dial out of the list.
        const shown = (o: THREE.Object3D | null): boolean => !o || (o.visible && shown(o.parent));
        return ray.intersectObjects(scene.children, true).filter((h) => shown(h.object)).slice(0, 12).map((h) => named(h.object));
      },
      angle: (id) => {
        const e = registry.get(id);
        return e ? (e.part.axis === 'x' ? e.group.rotation.x : e.group.rotation.z) : NaN;
      },
    };
  }, [caliber, camera, controls, size, scene, gl, rings]);

  useFrame((_, dt) => {
    if (controls && tween.current) {
      const { position, target, flip, done } = tween.current.step(Math.min(dt, MAX_FRAME));
      if (flipGroup.current) flipGroup.current.rotation.x = flip;
      camera.position.set(...position);
      controls.target.set(...target);
      // OrbitControls is disabled during a flight and stops re-aiming the camera, so aim it here; otherwise the
      // camera flies with a stale orientation and snaps when the controls are re-enabled.
      camera.lookAt(controls.target);
      controls.enabled = done;
      if (done) tween.current = null;
    }
    // Keep the subject in the part of the canvas the text panels leave free; the intro also shrinks the watch to fit
    // there. Eased, and the projection is only rebuilt while the frame is still moving.
    let extent: { x: number; y: number } | null = null;
    if (mode === 'intro' && controls) {
      // The case's reach from the target on screen at scale 1, perspective included (the rim nearer the camera looms).
      const px = size.height / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      tmp.copy(controls.target).applyMatrix4(camera.matrixWorldInverse);
      const tx = tmp.x / -tmp.z, ty = tmp.y / -tmp.z;
      let x = 0, y = 0;
      for (const p of rings[sideOf()]) {
        tmp.copy(p).applyMatrix4(camera.matrixWorldInverse);
        x = Math.max(x, Math.abs(tmp.x / -tmp.z - tx) * px);
        y = Math.max(y, Math.abs(tmp.y / -tmp.z - ty) * px);
      }
      // The sampled rim wobbles a little as the camera orbits; ignore that so the frame settles and stops updating.
      const r = reach.current;
      if (Math.abs(x - r.x) > r.x * 0.02 || Math.abs(y - r.y) > r.y * 0.02) Object.assign(r, { x, y });
      extent = r;
    }
    const want = frameFor(size.width, size.height, occluders.insets(), extent);
    const f = frame.current ?? { ...want };
    const k = frame.current ? 1 - Math.exp(-Math.min(dt, MAX_FRAME) * 4) : 1;
    f.dx += (want.dx - f.dx) * k;
    f.dy += (want.dy - f.dy) * k;
    f.scale += (want.scale - f.scale) * k;
    frame.current = f;
    const a = applied.current;
    if (a.w === size.width && a.h === size.height && Math.abs(a.dx - f.dx) < 0.05 && Math.abs(a.dy - f.dy) < 0.05 && Math.abs(a.scale - f.scale) < 1e-4) return;
    Object.assign(a, { w: size.width, h: size.height, dx: f.dx, dy: f.dy, scale: f.scale });
    if (Math.abs(f.dx) < 0.05 && Math.abs(f.dy) < 0.05 && Math.abs(f.scale - 1) < 1e-4) camera.clearViewOffset();
    else camera.setViewOffset(...viewOffset(size.width, size.height, f));
  });

  return null;
}
