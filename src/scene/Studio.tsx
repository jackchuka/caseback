import { Environment, Lightformer } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { useApp } from '../state/app';
import { LOOKS } from './looks';

export function Studio() {
  const theme = useApp((s) => s.theme);
  const quality = useApp((s) => s.quality);
  const look = LOOKS[theme];
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    gl.toneMappingExposure = look.exposure;
    scene.environmentIntensity = look.envIntensity;
  }, [gl, scene, look]);

  const shadowSize = quality === 'high' ? 2048 : 1024;
  return (
    <>
      <color attach="background" args={[look.background]} />
      <Environment key={theme} resolution={256} frames={1}>
        <Lightformer form="rect" intensity={look.softbox} color={look.softboxColor} scale={[18, 18, 1]} position={[0, 14, 0]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.2 * look.strip} scale={[5, 16, 1]} position={[-12, 3, 4]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.8 * look.strip} color={look.rimColor} scale={[5, 16, 1]} position={[12, 3, -4]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.6} scale={[20, 2, 1]} position={[0, -2, -12]} target={[0, 0, 0]} />
      </Environment>
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
      <mesh rotation-x={-Math.PI / 2} position-y={-3} receiveShadow>
        <circleGeometry args={[80, 64]} />
        <shadowMaterial opacity={look.shadowOpacity} />
      </mesh>
    </>
  );
}
