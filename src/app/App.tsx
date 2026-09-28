import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type { i18n } from 'i18next';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Caliber } from '../model/schema';
import type { Watch } from '../model/watch';
import { CameraRig } from '../scene/CameraRig';
import { Effects } from '../scene/Effects';
import { Exterior } from '../scene/Exterior';
import { movementFrame } from '../scene/exterior/frame';
import { dialRadius } from '../scene/exterior/legacy/dial';
import { watchHands } from '../scene/exterior/legacy/hands';
import { caseRadii } from '../scene/exterior/legacy/radii';
import { FlowPaths } from '../scene/FlowPaths';
import { flipGroup } from '../scene/flip';
import { MaterialsProvider } from '../scene/materials';
import { Movement } from '../scene/Movement';
import { Studio } from '../scene/Studio';
import { useApp } from '../state/app';
import { Dock } from '../ui/Dock';
import { Fallback } from '../ui/Fallback';
import { Hint } from '../ui/Hint';
import { useI18nLang, useKeyboard, useThemeAttr, useUrlSync } from '../ui/hooks';
import { InfoPanel } from '../ui/InfoPanel';
import { Intro } from '../ui/Intro';
import { TopBar } from '../ui/TopBar';
import { TourBar } from '../ui/TourBar';

export function App({ caliber, i18n, webgl, watch }: { caliber: Caliber; i18n: i18n; webgl: boolean; watch?: Watch }) {
  const quality = useApp((s) => s.quality);
  const mode = useApp((s) => s.mode);
  const handLayers = useMemo(() => {
    if (!watch) return undefined;
    const h = watchHands(watch.exterior, dialRadius(caseRadii(movementFrame(caliber), watch.exterior)));
    return { 'hour-hand': h.hour, 'minute-hand': h.minute };
  }, [caliber, watch]);
  useThemeAttr();
  useI18nLang(i18n);
  useKeyboard();
  useUrlSync(caliber);
  if (!webgl) return <Fallback />;
  return (
    <>
      <Canvas
        shadows
        dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
        camera={{ fov: 26, near: 0.5, far: 400, position: [-24, 52, 62] }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <MaterialsProvider>
          <Studio />
          <group ref={(g) => { flipGroup.current = g; }}>
          <Movement caliber={caliber} handLayers={handLayers}>
            <FlowPaths caliber={caliber} />
            <Exterior caliber={caliber} watch={watch} />
          </Movement>
          </group>
          <CameraRig caliber={caliber} watchFront={!!watch} />
        </MaterialsProvider>
        <OrbitControls makeDefault enableDamping minDistance={10} maxDistance={90} autoRotate={mode === 'intro'} autoRotateSpeed={0.35} enableZoom={mode !== 'intro'} />
        {quality === 'high' && <Effects />}
      </Canvas>
      <TopBar caliber={caliber} watch={watch} />
      <Intro caliber={caliber} watch={watch} />
      <InfoPanel caliber={caliber} />
      <TourBar caliber={caliber} />
      <Dock />
      <Hint />
    </>
  );
}
