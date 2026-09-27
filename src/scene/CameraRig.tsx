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
    __caseback?: { target(): V3; state(): AppState; project(focus: string): [number, number]; flip(): number; angle(id: string): number; hits(x: number, y: number): string[] };
  }
}

export function CameraRig({ caliber }: { caliber: Caliber }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const scene = useThree((s) => s.scene);
  const mode = useApp((s) => s.mode);
  const stepIndex = useApp((s) => s.stepIndex);
  const freeSide = useApp((s) => s.freeSide);
  const tween = useRef<Tween | null>(null);
  const shift = useRef(-0.16);

  useEffect(() => {
    if (!controls) return;
    tween.current = new Tween(camera.position.toArray() as V3, controls.target.toArray() as V3, shotFor(caliber, mode, stepIndex, freeSide), flipGroup.current?.rotation.x ?? 0);
    window.__caseback = {
      target: () => controls.target.toArray() as V3,
      state: () => appStore().getState(),
      project: (focus) => {
        const side = (flipGroup.current?.rotation.x ?? 0) > Math.PI / 2 ? 'dial' : 'back';
        const v = new THREE.Vector3(...toWorld(focusCenterLocal(caliber, focus, side), side)).project(camera);
        return [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
      },
      flip: () => flipGroup.current?.rotation.x ?? 0,
      hits: (x, y) => {
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1), camera);
        const named = (o: THREE.Object3D | null): string => (!o ? '' : o.name || named(o.parent));
        return ray.intersectObjects(scene.children, true).filter((h) => h.object.visible).slice(0, 5).map((h) => named(h.object));
      },
      angle: (id) => {
        const e = registry.get(id);
        return e ? (e.part.axis === 'x' ? e.group.rotation.x : e.group.rotation.z) : NaN;
      },
    };
  }, [caliber, camera, controls, mode, stepIndex, freeSide, size, scene]);

  useFrame((_, dt) => {
    if (controls && tween.current) {
      const { position, target, flip, done } = tween.current.step(Math.min(dt, 0.05));
      if (flipGroup.current) flipGroup.current.rotation.x = flip;
      camera.position.set(...position);
      controls.target.set(...target);
      controls.enabled = done;
      if (done) tween.current = null;
    }
    const wanted = mode === 'intro' ? -0.16 : size.width > 768 ? 0.1 : 0;
    shift.current += (wanted - shift.current) * 0.05;
    camera.setViewOffset(size.width, size.height, shift.current * size.width, 0, size.width, size.height);
  });

  return null;
}
