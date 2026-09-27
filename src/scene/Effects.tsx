import { Bloom, DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing';

export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <DepthOfField target={[0, 0, 0]} focalLength={0.02} bokehScale={1.5} />
      <Bloom intensity={0.1} luminanceThreshold={0.97} luminanceSmoothing={0.35} mipmapBlur />
      <Vignette eskil={false} offset={0.25} darkness={0.55} />
    </EffectComposer>
  );
}
