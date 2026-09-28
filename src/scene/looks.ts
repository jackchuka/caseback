import type { Theme } from '../state/store';

export type Look = {
  background: string;
  exposure: number;
  envIntensity: number;
  fill: number;
  softbox: number;
  softboxColor: string;
  strip: number;
  rimColor: string;
  key: number;
  keyColor: string;
  rim: number;
  shadowOpacity: number;
};

export const LOOKS: Record<Theme, Look> = {
  dark: {
    background: '#0b0b0d', exposure: 0.95, envIntensity: 2.4, fill: 0.25, softbox: 1.9, softboxColor: '#ffffff', strip: 1,
    rimColor: '#bfd0ff', key: 1.1, keyColor: '#ffffff', rim: 0.4, shadowOpacity: 0.5,
  },
  light: {
    background: '#ecebe7', exposure: 0.8, envIntensity: 1.6, fill: 0.35, softbox: 1.6, softboxColor: '#ffffff', strip: 0.9,
    rimColor: '#ffffff', key: 1.0, keyColor: '#ffffff', rim: 0.3, shadowOpacity: 0.22,
  },
};
