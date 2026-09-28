import type { ExteriorBuilder, ExteriorContext } from './contract';
import { packExterior } from './transfer';

// Only the requested watch's module loads here; the catalog's validation stays on the main thread.
const builders = import.meta.glob<ExteriorBuilder>('../../../data/watches/*/*/exterior.ts', { import: 'default' });

export type BuildRequest = { id: number; watchId: string; ctx: ExteriorContext };

self.onmessage = async ({ data }: MessageEvent<BuildRequest>) => {
  try {
    const load = builders[`../../../data/watches/${data.watchId}/exterior.ts`];
    if (!load) throw new Error(`no exterior for watch ${data.watchId}`);
    const { packed, transfer } = packExterior((await load()).geometry(data.ctx));
    self.postMessage({ id: data.id, packed }, { transfer });
  } catch (e) {
    self.postMessage({ id: data.id, error: String(e instanceof Error ? e.stack ?? e.message : e) });
  }
};
