import { calibers } from '../calibers';
import { validateWatch, WatchSchema, type Watch } from '../../src/model/watch';

const modules = import.meta.glob<Watch>('./*/*/watch.ts', { eager: true, import: 'default' });

export const watches: Record<string, Watch> = {};
for (const [path, raw] of Object.entries(modules)) {
  const w = WatchSchema.parse(raw);
  const errors = validateWatch(w, calibers);
  if (errors.length > 0) throw new Error(`${path}\n${errors.join('\n')}`);
  if (!path.includes(`/${w.id}/`)) throw new Error(`${path}: id ${w.id} does not match its folder`);
  watches[w.id] = w;
}

export const getWatch = (id: string): Watch | undefined => watches[id];
export const watchesForCaliber = (caliberId: string): Watch[] =>
  Object.values(watches).filter((w) => w.caliberId === caliberId).sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
