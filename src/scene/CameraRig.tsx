import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Caliber } from '../model/schema';
import { appStore, useApp } from '../state/app';
import type { AppState } from '../state/store';
import type { V3 } from './focus';
import { shotFor } from './shots';
import { Tween } from './tween';

declare global {
  interface Window {
    __caseback?: { target(): V3; state(): AppState };
  }
}

export function CameraRig({ caliber }: { caliber: Caliber }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const mode = useApp((s) => s.mode);
  const stepIndex = useApp((s) => s.stepIndex);
  const tween = useRef<Tween | null>(null);
  const shift = useRef(-0.16);

  useEffect(() => {
    if (!controls) return;
    tween.current = new Tween(camera.position.toArray() as V3, controls.target.toArray() as V3, shotFor(caliber, mode, stepIndex));
    window.__caseback = { target: () => controls.target.toArray() as V3, state: () => appStore().getState() };
  }, [caliber, camera, controls, mode, stepIndex]);

  useFrame((_, dt) => {
    if (controls && tween.current) {
      const { position, target, done } = tween.current.step(Math.min(dt, 0.05));
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
