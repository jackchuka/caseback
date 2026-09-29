import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { flipGroup } from './flip';
import { useApp } from '../state/app';
import { LOOKS } from './looks';
import { buildStudioEnvironments } from './studioEnv';
import { neutralInverse } from './tone';

// `composer`: the frame is tone mapped after the fact (Effects), background included, so the background is set to the
// colour the curve maps onto the theme's. `faceUp`: turn the studio so its overhead softbox sits behind a camera that
// looks straight at the dial (the compare page stands the watch up; in the app it lies dial-up under the softbox).
export function Studio({ composer = false, faceUp = false }: { composer?: boolean; faceUp?: boolean }) {
  const theme = useApp((s) => s.theme);
  const quality = useApp((s) => s.quality);
  const look = LOOKS[theme];
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  const background = useMemo(() => {
    const c = new THREE.Color(look.background);
    return composer ? new THREE.Color(...neutralInverse([c.r, c.g, c.b], look.exposure)) : c;
  }, [look, composer]);
  const envs = useMemo(() => buildStudioEnvironments(gl), [gl]);
  useEffect(() => {
    gl.toneMappingExposure = look.exposure;
    scene.environment = theme === 'light' ? envs.light : envs.dark;
    scene.environmentIntensity = look.envIntensity;
    scene.environmentRotation.set(faceUp ? -0.66 : 0, 0, 0);
  }, [gl, scene, look, theme, envs, faceUp]);

  const floor = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (floor.current) floor.current.position.y = -3 - 2.4 * ((flipGroup.current?.rotation.x ?? 0) / Math.PI);
  });

  const shadowSize = quality === 'high' ? 2048 : 1024;
  return (
    <>
      <color attach="background" args={[background.r, background.g, background.b]} />
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
