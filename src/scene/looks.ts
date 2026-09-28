import type { Theme } from '../state/store';

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
    background: '#0b0b0d', exposure: 0.95, envIntensity: 1.1,
    rimColor: '#bfd0ff', key: 1.1, keyColor: '#ffffff', rim: 0.4, shadowOpacity: 0.5,
  },
  light: {
    background: '#ecebe7', exposure: 0.8, envIntensity: 0.65,
    rimColor: '#ffffff', key: 1.0, keyColor: '#ffffff', rim: 0.3, shadowOpacity: 0.22,
  },
};
