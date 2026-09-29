import { calibers } from '../calibers';
import { validateWatch, WatchSchema, type WatchMeta } from '../../src/model/watch';

// Metadata only: the catalog pages list watches without pulling in their three.js exterior builders.
const metas = import.meta.glob<WatchMeta>('./*/*/watch.ts', { eager: true, import: 'default' });

export const watchMetas: Record<string, WatchMeta> = {};
for (const [path, raw] of Object.entries(metas)) {
  const w = WatchSchema.parse(raw);
  const errors = validateWatch(w, calibers);
  if (errors.length > 0) throw new Error(`${path}\n${errors.join('\n')}`);
  if (!path.includes(`/${w.id}/`)) throw new Error(`${path}: id ${w.id} does not match its folder`);
  watchMetas[w.id] = w;
}

export const watchesForCaliber = (caliberId: string): WatchMeta[] =>
  Object.values(watchMetas).filter((w) => w.caliberId === caliberId).sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
