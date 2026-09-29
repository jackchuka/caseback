import * as THREE from 'three';

// three.js ignores a material's envMapIntensity whenever its reflections come from scene.environment: it uploads
// scene.environmentIntensity in its place, so every per-material boost or damping was silently dropped. The studio
// lights everything through scene.environment, so the strength travels as a define instead: part of the program key,
// no uniform and no per-frame work. Material.copy resets defines, so apply this to the instance that renders.
const CHUNK = 'envmap_physical_pars_fragment';
if (!THREE.ShaderChunk[CHUNK].includes('ENV_SCALE')) {
  THREE.ShaderChunk[CHUNK] = `#ifndef ENV_SCALE\n#define ENV_SCALE 1.0\n#endif\n${THREE.ShaderChunk[CHUNK].replaceAll('* envMapIntensity', '* envMapIntensity * ENV_SCALE')}`;
}

export function honourEnvMapIntensity<M extends THREE.Material>(m: M): M {
  if (!(m instanceof THREE.MeshStandardMaterial) || m.envMap || m.envMapIntensity === 1) return m;
  m.defines = { ...m.defines, ENV_SCALE: m.envMapIntensity.toFixed(4) };
  return m;
}
