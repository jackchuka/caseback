export type WebGLProbe = { error: string | null; renderer: string };

// Probes a throwaway context once. Chrome gives the reason a context cannot be made (a blocklisted GPU, a site
// blocked after it lost the GPU) only through the canvas's webglcontextcreationerror event.
export function probeWebGL(): WebGLProbe {
  let reason = '';
  try {
    const c = document.createElement('canvas');
    c.addEventListener('webglcontextcreationerror', (e) => (reason ||= (e as WebGLContextEvent).statusMessage), false);
    const gl = c.getContext('webgl2') ?? c.getContext('webgl');
    if (!gl) return { error: reason || 'no WebGL context', renderer: '' };
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { error: null, renderer };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e), renderer: '' };
  }
}

// The Pixel 10's PowerVR D-Series driver resets, losing every context on the page, once enough draws in a frame
// sample a shadow map; every movement part receives shadows, so the scene dies within its first frames.
// https://github.com/mephistopheles4/stacks/issues/381
export function shadowsSupported(renderer: string): boolean {
  return !/PowerVR|Imagination/i.test(renderer);
}
