import * as THREE from 'three';

export function canvasTexture(width: number, height: number, draw: (g: CanvasRenderingContext2D) => void, anisotropy = 1) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}
