import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

// Matches the approved prototype: a faint bloom on specular highlights only. Depth of field is left out on purpose:
// the postprocessing DOF blurs at reduced resolution and made every gear look soft.
// The composer turns the renderer's tone mapping off, so the curve (looks.ts TONE_MAPPING) is applied here, last,
// in the same effect pass as the bloom: no extra pass.
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom intensity={0.1} luminanceThreshold={0.97} luminanceSmoothing={0.35} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  );
}
