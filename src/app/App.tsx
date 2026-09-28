import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type { i18n } from 'i18next';
import { Suspense, use, useMemo } from 'react';
import * as THREE from 'three';
import type { Caliber } from '../model/schema';
import type { Watch } from '../model/watch';
import { CameraRig } from '../scene/CameraRig';
import { Effects } from '../scene/Effects';
import { Exterior } from '../scene/Exterior';
import type { ExteriorBuild } from '../scene/exterior/contract';
import { discMaterials } from '../scene/exterior/discMaterials';
import { movementFrame } from '../scene/exterior/frame';
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

export function App({ caliber, i18n, webgl, watch, exterior }: { caliber: Caliber; i18n: i18n; webgl: boolean; watch?: Watch; exterior: ExteriorBuild | Promise<ExteriorBuild> }) {
  const quality = useApp((s) => s.quality);
  const mode = useApp((s) => s.mode);
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
        // The effect composer multisamples its own buffer on high; the canvas's MSAA would only be discarded.
        gl={{ antialias: quality !== 'high', toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <MaterialsProvider>
          <Studio />
          <Suspense fallback={null}>
            <Scene caliber={caliber} watch={watch} exterior={exterior} />
          </Suspense>
        </MaterialsProvider>
        <OrbitControls makeDefault enableDamping minDistance={10} maxDistance={140} autoRotate={mode === 'intro'} autoRotateSpeed={0.35} enableZoom={mode !== 'intro'} />
        {quality === 'high' && <Effects />}
      </Canvas>
      <TopBar caliber={caliber} watch={watch} />
      <Intro caliber={caliber} watch={watch} />
      <InfoPanel caliber={caliber} />
      <TourBar caliber={caliber} />
      <Dock caliber={caliber} />
      <Hint />
    </>
  );
}

// Suspends until a watch's exterior arrives from its worker; the camera rig waits with it so its opening flip
// starts on a mounted group.
function Scene({ caliber, watch, exterior }: { caliber: Caliber; watch?: Watch; exterior: ExteriorBuild | Promise<ExteriorBuild> }) {
  const watchFront = !!watch;
  const build = exterior instanceof Promise ? use(exterior) : exterior;
  const frame = useMemo(() => movementFrame(caliber), [caliber]);
  // A watch's own hands replace the movement's; the generic case keeps the movement's.
  const handLayers = useMemo(
    () => (build.parts.hands.hour.length > 0 ? { 'hour-hand': build.parts.hands.hour, 'minute-hand': build.parts.hands.minute, ...build.parts.hands.extra } : undefined),
    [build],
  );
  const discs = useMemo(() => discMaterials(build.materials), [build]);
  return (
    <>
      <group ref={(g) => { flipGroup.current = g; }}>
        <Movement caliber={caliber} handLayers={handLayers} discMaterials={discs}>
          <FlowPaths caliber={caliber} />
          <Exterior caliber={caliber} watch={watch} build={build} frame={frame} watchFront={watchFront} />
        </Movement>
      </group>
      <CameraRig caliber={caliber} watchFront={watchFront} />
    </>
  );
}
