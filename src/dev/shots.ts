export type View = 'front' | 'side' | 'three-quarter';
// Orthographic: product photos are shot long, so perspective is negligible. `center` is the photo pixel under the
// watch's centre; `rotation` turns the watch (Euler XYZ, watch frame: dial toward the camera, 12 o'clock up).
export type ShotCamera = { mmPerPx: number; center: [number, number]; rotation: [number, number, number] };
export type Shot = { id: string; file: string; sourceUrl: string; view: View; time: string; camera: ShotCamera };

export const VIEW_ROTATIONS: Record<View, [number, number, number]> = {
  front: [0, 0, 0],
  // Crown toward the camera.
  side: [0, Math.PI / 2, 0],
  'three-quarter': [0.35, 0.6, 0],
};

export function parseTime(hms: string): number {
  const m = hms.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!m) throw new Error(`time must be H:MM:SS, got ${hms}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

// Screen right is +X and screen down is +Y in the watch frame, so the camera moves opposite to the pixel offset.
export function cameraOffset(cam: ShotCamera, width: number, height: number): [number, number] {
  return [(width / 2 - cam.center[0]) * cam.mmPerPx, (height / 2 - cam.center[1]) * cam.mmPerPx];
}

export function defaultCamera(view: View, size: number): ShotCamera {
  return { mmPerPx: 60 / size, center: [size / 2, size / 2], rotation: VIEW_ROTATIONS[view] };
}
