import { Bloom, EffectComposer } from '@react-three/postprocessing';

// Matches the approved prototype: a faint bloom on specular highlights only. Depth of field is left out on purpose:
// the postprocessing DOF blurs at reduced resolution and made every gear look soft.
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom intensity={0.1} luminanceThreshold={0.97} luminanceSmoothing={0.35} mipmapBlur />
    </EffectComposer>
  );
}
