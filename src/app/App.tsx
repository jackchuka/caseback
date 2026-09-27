import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import type { Caliber } from '../model/schema';
import { Effects } from '../scene/Effects';
import { MaterialsProvider } from '../scene/materials';
import { Movement } from '../scene/Movement';
import { Studio } from '../scene/Studio';
import { useApp } from '../state/app';
import { Fallback } from '../ui/Fallback';
import { hasWebGL } from './webgl';

export function App({ caliber }: { caliber: Caliber }) {
  const quality = useApp((s) => s.quality);
  if (!hasWebGL()) return <Fallback />;
  return (
    <Canvas
      shadows
      dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
      camera={{ fov: 26, near: 0.5, far: 400, position: [-24, 52, 62] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <MaterialsProvider>
        <Studio />
        <Movement caliber={caliber} />
      </MaterialsProvider>
      <OrbitControls makeDefault enableDamping minDistance={10} maxDistance={90} />
      {quality === 'high' && <Effects />}
    </Canvas>
  );
}
