import type * as THREE from 'three';

// Reads a per-vertex `polish` attribute (0 brushed … 1 polished) so one case mesh carries both finishes with a soft
// boundary along the true crease. Meshes without the attribute read 0 and stay brushed.
export function withPolish(m: THREE.MeshPhysicalMaterial, polishedRoughness: number) {
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float polish;\nvarying float vPolish;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPolish = polish;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vPolish;')
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, ${polishedRoughness.toFixed(3)}, vPolish);`);
  };
  return m;
}

// Blends finishes (0 brushed … 1 polished) from terms [finish, t], where t is how close each face is to bounding the
// solid (its signed distance term): the finishes meet along the true crease rather than along grid triangles.
export function softFinish(k: Array<[number, number]>, width = 0.04) {
  const top = Math.max(...k.map(([, t]) => t));
  let sum = 0, weight = 0;
  for (const [f, t] of k) {
    const w = Math.exp((t - top) / width);
    sum += f * w;
    weight += w;
  }
  return sum / weight;
}
