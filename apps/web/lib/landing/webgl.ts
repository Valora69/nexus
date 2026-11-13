// Renderers that mean WebGL is running on the CPU, where a 3D hero would be
// slow and drain the battery.
const SOFTWARE_RENDERER =
  /swiftshader|llvmpipe|softpipe|software|basic render driver/i;

export function isSoftwareRenderer(renderer: string): boolean {
  return SOFTWARE_RENDERER.test(renderer);
}

function probe(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    // Refuse slow paths (software rendering, blocklisted GPUs) up front.
    const attributes = { failIfMajorPerformanceCaveat: true };
    const gl = (canvas.getContext('webgl2', attributes) ??
      canvas.getContext('webgl', attributes)) as WebGLRenderingContext | null;
    if (!gl) return false;
    const renderer = String(gl.getParameter(gl.RENDERER) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !isSoftwareRenderer(renderer);
  } catch {
    return false;
  }
}

let cached: boolean | undefined;

/**
 * Whether this browser can draw the 3D hero laptop on a GPU. Probes once with
 * a throwaway canvas and releases its context straight away.
 */
export function canUseWebGL(): boolean {
  if (cached === undefined) cached = probe();
  return cached;
}
