import * as THREE from 'three';
import type { Theme } from '../state/store';
import type { Tone } from './tone';

// Each theme's tone curve applies on every render path: the renderer's on low quality and the compare page, Effects'
// on high (the composer switches the renderer's off). Chosen from rendered candidates: the dark studio is filmic
// (ACES, a faint fill in the reflections) so steel keeps depth without going murky; the light studio stays on
// Khronos PBR Neutral, which keeps base colours as authored, with no fill and a strong key and rim, because ACES
// washed it out.
export const THREE_TONE: Record<Tone, THREE.ToneMapping> = { neutral: THREE.NeutralToneMapping, aces: THREE.ACESFilmicToneMapping };

export type Look = {
  tone: Tone;
  // Overhead, horizon and underside radiance of a dim dome behind the studio's softboxes, or none.
  fill: readonly [number, number, number] | null;
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
    tone: 'aces', fill: [0.12, 0.04, 0], background: '#0b0b0d', exposure: 1, envIntensity: 1.1,
    rimColor: '#bfd0ff', key: 1.4, keyColor: '#ffffff', rim: 0.9, shadowOpacity: 0.5,
  },
  light: {
    tone: 'neutral', fill: null, background: '#ecebe7', exposure: 1, envIntensity: 0.7,
    rimColor: '#ffffff', key: 1.4, keyColor: '#ffffff', rim: 0.5, shadowOpacity: 0.22,
  },
};
