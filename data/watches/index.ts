import { calibers } from '../calibers';
import type { ExteriorBuilder } from '../../src/scene/exterior/contract';
import { validateWatch, WatchSchema, type Watch, type WatchMeta } from '../../src/model/watch';

const metas = import.meta.glob<WatchMeta>('./*/*/watch.ts', { eager: true, import: 'default' });
const exteriors = import.meta.glob<ExteriorBuilder>('./*/*/exterior.ts', { eager: true, import: 'default' });

for (const path of Object.keys(exteriors)) {
  const metaPath = path.replace(/exterior\.ts$/, 'watch.ts');
  if (!(metaPath in metas)) throw new Error(`${path}: no watch.ts beside it`);
}

export const watches: Record<string, Watch> = {};
for (const [path, raw] of Object.entries(metas)) {
  const w = WatchSchema.parse(raw);
  const errors = validateWatch(w, calibers);
  if (errors.length > 0) throw new Error(`${path}\n${errors.join('\n')}`);
  if (!path.includes(`/${w.id}/`)) throw new Error(`${path}: id ${w.id} does not match its folder`);
  const exterior = exteriors[path.replace(/watch\.ts$/, 'exterior.ts')];
  if (!exterior) throw new Error(`${path}: no exterior.ts beside it`);
  watches[w.id] = { ...w, exterior };
}

export const getWatch = (id: string): Watch | undefined => watches[id];
export const watchesForCaliber = (caliberId: string): Watch[] =>
  Object.values(watches).filter((w) => w.caliberId === caliberId).sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
