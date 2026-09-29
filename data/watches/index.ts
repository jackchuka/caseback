import type { ExteriorBuilder } from '../../src/scene/exterior/contract';
import type { Watch } from '../../src/model/watch';
import { watchMetas } from './meta';

const exteriors = import.meta.glob<ExteriorBuilder>('./*/*/exterior.ts', { eager: true, import: 'default' });

export const watches: Record<string, Watch> = {};
for (const [path, exterior] of Object.entries(exteriors)) {
  const id = path.replace(/^\.\/|\/exterior\.ts$/g, '');
  const meta = watchMetas[id];
  if (!meta) throw new Error(`${path}: no watch.ts beside it`);
  watches[id] = { ...meta, exterior };
}
for (const id of Object.keys(watchMetas)) if (!watches[id]) throw new Error(`${id}: no exterior.ts beside it`);

export const getWatch = (id: string): Watch | undefined => watches[id];
