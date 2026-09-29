import * as THREE from 'three';
import type { Theme } from '../state/store';

// One tone curve for every render path. Khronos PBR Neutral keeps base colours as authored below ~0.76 and only rolls
// off highlights, so a dial's print and a lume's cream read as painted. With the effect composer on, the renderer's
// own tone mapping is switched off and Effects applies the same curve; before, the composer path had none at all and
// the compare page used ACES, so the two never looked alike.
export const TONE_MAPPING = THREE.NeutralToneMapping;

export type Look = {
  background: string;
  exposure: number;
  envIntensity: number;
  rimColor: string;
  key: number;
  keyColor: string;
  rim: number;
  shadowOpacity: number;
};

export const LOOKS: Record<Theme, Look> = {
  dark: {
    background: '#0b0b0d', exposure: 1, envIntensity: 1.1,
    rimColor: '#bfd0ff', key: 1.1, keyColor: '#ffffff', rim: 0.4, shadowOpacity: 0.5,
  },
  light: {
    background: '#ecebe7', exposure: 1, envIntensity: 0.85,
    rimColor: '#ffffff', key: 1.0, keyColor: '#ffffff', rim: 0.3, shadowOpacity: 0.22,
  },
};
