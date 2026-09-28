import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Caliber } from '../model/schema';
import { appStore, useApp } from '../state/app';
import type { AppState } from '../state/store';
import { focusCenterLocal, toWorld, type V3 } from './focus';
import { flipGroup } from './flip';
import { registry } from './registry';
import { shotFor } from './shots';
import { Tween } from './tween';

declare global {
  interface Window {
    __caseback?: { target(): V3; state(): AppState; project(focus: string): [number, number]; flip(): number; angle(id: string): number; hits(x: number, y: number): string[]; camera(): V3; probe(id: string): [number, number]; quat(): number[]; enabled(): boolean; three(): { scene: THREE.Scene; gl: THREE.WebGLRenderer }; pose(position: V3, target: V3): void };
  }
}

export function CameraRig({ caliber, watchFront = false }: { caliber: Caliber; watchFront?: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const mode = useApp((s) => s.mode);
  const stepIndex = useApp((s) => s.stepIndex);
  const freeSide = useApp((s) => s.freeSide);
  const tween = useRef<Tween | null>(null);
  const shift = useRef(-0.16);

  // Only a new shot (mode, step, side) starts a flight; resizes, scene or hook changes must never re-fly the camera.
  useEffect(() => {
    if (!controls) return;
    tween.current = new Tween(camera.position.toArray() as V3, controls.target.toArray() as V3, shotFor(caliber, mode, stepIndex, freeSide, watchFront), flipGroup.current?.rotation.x ?? 0);
  }, [caliber, camera, controls, mode, stepIndex, freeSide, watchFront]);

  useEffect(() => {
    if (!controls) return;
    window.__caseback = {
      target: () => controls.target.toArray() as V3,
      state: () => appStore().getState(),
      project: (focus) => {
        const side = (flipGroup.current?.rotation.x ?? 0) > Math.PI / 2 ? 'dial' : 'back';
        const v = new THREE.Vector3(...toWorld(focusCenterLocal(caliber, focus, side), side)).project(camera);
        return [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
      },
      flip: () => flipGroup.current?.rotation.x ?? 0,
      camera: () => camera.position.toArray() as V3,
      quat: () => camera.quaternion.toArray().map((v) => +v.toFixed(4)),
      enabled: () => controls.enabled,
      three: () => ({ scene, gl }),
      pose: (position, target) => {
        tween.current = null;
        controls.autoRotate = false;
        camera.position.set(...position);
        controls.target.set(...target);
        camera.lookAt(controls.target);
        controls.update();
      },
      probe: (id) => {
        const e = registry.get(id);
        if (!e) return [NaN, NaN];
        const v = e.group.getWorldPosition(new THREE.Vector3()).project(camera);
        return [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
      },
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
  }, [caliber, camera, controls, mode, stepIndex, freeSide, size, scene, gl]);

  useFrame((_, dt) => {
    if (controls && tween.current) {
      const { position, target, flip, done } = tween.current.step(Math.min(dt, 0.05));
      if (flipGroup.current) flipGroup.current.rotation.x = flip;
      camera.position.set(...position);
      controls.target.set(...target);
      // OrbitControls is disabled during a flight and stops re-aiming the camera, so aim it here; otherwise the
      // camera flies with a stale orientation and snaps when the controls are re-enabled.
      camera.lookAt(controls.target);
      controls.enabled = done;
      if (done) tween.current = null;
    }
    const wanted = mode === 'intro' ? -0.16 : size.width > 768 ? 0.1 : 0;
    shift.current += (wanted - shift.current) * 0.05;
    camera.setViewOffset(size.width, size.height, shift.current * size.width, 0, size.width, size.height);
  });

  return null;
}
