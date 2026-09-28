import type { ExteriorContext, ExteriorGeometry } from './contract';
import type { BuildRequest } from './build.worker';
import { unpackExterior, type PackedExterior } from './transfer';

type BuildResponse = { id: number; packed?: PackedExterior; error?: string };

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (g: ExteriorGeometry) => void; reject: (e: Error) => void }>();

// A watch's case and bracelet mesh an SDF, which blocks for up to a second; the worker keeps the page responsive
// while it runs and lets the movement's geometry, textures and shaders be prepared alongside it.
export function buildExteriorGeometry(watchId: string, ctx: ExteriorContext): Promise<ExteriorGeometry> {
  worker ??= createWorker();
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker!.postMessage({ id, watchId, ctx } satisfies BuildRequest);
  });
}

function createWorker() {
  const w = new Worker(new URL('./build.worker.ts', import.meta.url), { type: 'module' });
  w.onmessage = ({ data }: MessageEvent<BuildResponse>) => {
    const p = pending.get(data.id);
    if (!p) return;
    pending.delete(data.id);
    if (data.packed) p.resolve(unpackExterior(data.packed));
    else p.reject(new Error(data.error));
  };
  w.onerror = (e) => {
    for (const p of pending.values()) p.reject(new Error(e.message));
    pending.clear();
  };
  return w;
}
