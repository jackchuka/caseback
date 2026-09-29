import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Outline, ToneMapping } from '@react-three/postprocessing';
import { BlendFunction, KernelSize, ToneMappingMode } from 'postprocessing';
import { useRef, useState } from 'react';
import type * as THREE from 'three';
import type { Caliber } from '../model/schema';
import { focusKey } from '../model/validate';
import { appStore, useApp } from '../state/app';
import type { Theme } from '../state/store';
import { LOOKS } from './looks';
import { registry } from './registry';

// Matches the approved prototype: a faint bloom on specular highlights only. Depth of field is left out on purpose:
// the postprocessing DOF blurs at reduced resolution and made every gear look soft.
// The composer turns the renderer's tone mapping off, so the curve (the theme's, looks.ts) is applied here, last,
// in the same effect pass as the bloom.
const COMPOSER_TONE = { neutral: ToneMappingMode.NEUTRAL, aces: ToneMappingMode.ACES_FILMIC } as const;

export function Effects({ caliber }: { caliber: Caliber }) {
  const theme = useApp((s) => s.theme);
  return (
    // The outline's mask pass needs the composer not to clear between passes.
    <EffectComposer multisampling={4} autoClear={false}>
      <Bloom intensity={0.1} luminanceThreshold={0.97} luminanceSmoothing={0.35} mipmapBlur />
      <FocusOutline key={theme} caliber={caliber} theme={theme} />
      <ToneMapping mode={COMPOSER_TONE[LOOKS[theme].tone]} />
    </EffectComposer>
  );
}

// The tour's focused part is outlined in the site accent rather than recoloured: the parts around it keep their
// own look. Screen blending vanishes on the light studio and alpha blending of the thin edge stays faint, so there
// the edge subtracts mostly blue: a dark amber line, and zero (untouched) everywhere off the edge. Occluded edges (a
// barrel under its bridge) still show, fainter.
const LOOK = {
  dark: { blend: BlendFunction.SCREEN, visible: 0xffc860, hidden: 0x8a6a30, strength: 12, blur: true },
  light: { blend: BlendFunction.SUBTRACT, visible: 0x90b0f0, hidden: 0x6078a0, strength: 8, blur: true },
} as const;

function FocusOutline({ caliber, theme }: { caliber: Caliber; theme: Theme }) {
  const [selection, setSelection] = useState<THREE.Object3D[]>([]);
  const last = useRef('');
  const look = LOOK[theme];

  useFrame(() => {
    const s = appStore().getState();
    const focus = s.mode === 'tour' ? caliber.tour[s.stepIndex]!.focus : s.mode === 'free' ? s.selected : null;
    // Parts register as they mount (a watch's movement waits for its exterior), so the count is part of the key.
    const key = `${focus}|${registry.size}`;
    if (key === last.current) return;
    last.current = key;
    const meshes: THREE.Object3D[] = [];
    if (focus !== null) {
      for (const e of registry.values()) {
        if (focusKey(e.part) === focus) e.group.traverse((o) => void ((o as THREE.Mesh).isMesh && meshes.push(o)));
      }
    }
    setSelection(meshes);
  });

  return <Outline selection={selection} blendFunction={look.blend} visibleEdgeColor={look.visible} hiddenEdgeColor={look.hidden} edgeStrength={look.strength} kernelSize={KernelSize.SMALL} blur={look.blur} xRay resolutionScale={0.5} />;
}
