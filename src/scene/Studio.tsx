import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { flipGroup } from './flip';
import { useApp } from '../state/app';
import { LOOKS } from './looks';
import { buildStudioEnvironments } from './studioEnv';

export function Studio() {
  const theme = useApp((s) => s.theme);
  const quality = useApp((s) => s.quality);
  const look = LOOKS[theme];
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  const envs = useMemo(() => buildStudioEnvironments(gl), [gl]);
  useEffect(() => {
    gl.toneMappingExposure = look.exposure;
    scene.environment = theme === 'light' ? envs.light : envs.dark;
    scene.environmentIntensity = look.envIntensity;
  }, [gl, scene, look, theme, envs]);

  const floor = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (floor.current) floor.current.position.y = -3 - 2.4 * ((flipGroup.current?.rotation.x ?? 0) / Math.PI);
  });

  const shadowSize = quality === 'high' ? 2048 : 1024;
  return (
    <>
      <color attach="background" args={[look.background]} />
      <directionalLight
        castShadow
        position={[-14, 30, 10]}
        intensity={look.key}
        color={look.keyColor}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20, 0.5, 80]} />
      </directionalLight>
      <directionalLight position={[20, 8, -20]} intensity={look.rim} color={look.rimColor} />
      <mesh ref={floor} rotation-x={-Math.PI / 2} position-y={-3} receiveShadow>
        <circleGeometry args={[80, 64]} />
        <shadowMaterial opacity={look.shadowOpacity} />
      </mesh>
    </>
  );
}
