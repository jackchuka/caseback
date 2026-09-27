import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Caliber } from '../model/schema';
import { appStore } from '../state/app';
import { flowStates, localIndex } from '../tour/engine';
import { focusCenterLocal } from './focus';
import { flowStripe } from './textures';

export function FlowPaths({ caliber }: { caliber: Caliber }) {
  const segments = useMemo(() => {
    const stripe = flowStripe();
    return caliber.chapters.flatMap((ch) =>
      ch.flow.slice(1).map((key, k) => {
        const a = new THREE.Vector3(...focusCenterLocal(caliber, ch.flow[k]!));
        const b = new THREE.Vector3(...focusCenterLocal(caliber, key));
        const mid = a.clone().add(b).multiplyScalar(0.5);
        mid.z = Math.max(a.z, b.z) + 0.9;
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        const map = stripe.clone();
        map.needsUpdate = true;
        map.repeat.set(Math.max(1, Math.round(curve.getLength() / 2.2)), 1);
        const material = new THREE.MeshBasicMaterial({ map, color: 0xffd28a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
        return { chapter: ch.id, index: k, geometry: new THREE.TubeGeometry(curve, 64, 0.09, 8), material };
      }),
    );
  }, [caliber]);

  useFrame((_, dt) => {
    const s = appStore().getState();
    const step = caliber.tour[s.stepIndex]!;
    const chapter = caliber.chapters.find((ch) => ch.id === step.chapter)!;
    const targets = flowStates(chapter.flow.length, localIndex(caliber.tour, s.stepIndex));
    const light = s.theme === 'light';
    for (const seg of segments) {
      const on = s.mode === 'tour' && seg.chapter === step.chapter ? targets[seg.index] ?? 0 : 0;
      seg.material.opacity += (on * 0.95 - seg.material.opacity) * 0.08;
      seg.material.map!.offset.x -= dt * 0.9;
      const blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
      if (seg.material.blending !== blending) {
        seg.material.blending = blending;
        seg.material.color.set(light ? 0xd08a1a : 0xffd28a);
        seg.material.needsUpdate = true;
      }
    }
  });

  return (
    <>
      {segments.map((seg) => (
        <mesh key={`${seg.chapter}-${seg.index}`} geometry={seg.geometry} material={seg.material} renderOrder={10} raycast={() => null} />
      ))}
    </>
  );
}
