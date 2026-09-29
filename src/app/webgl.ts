// Returns null when WebGL works, or why it does not. Chrome gives the reason (a blocklisted GPU, a site blocked
// after it lost the GPU) only through the canvas's webglcontextcreationerror event.
export function webglError(): string | null {
  let reason = '';
  try {
    const c = document.createElement('canvas');
    c.addEventListener('webglcontextcreationerror', (e) => (reason ||= (e as WebGLContextEvent).statusMessage), false);
    const gl = c.getContext('webgl2') ?? c.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return gl ? null : reason || 'no WebGL context';
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}
