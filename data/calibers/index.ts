import { CaliberSchema, type Caliber } from '../../src/model/schema';
import { validateCaliber } from '../../src/model/validate';

const modules = import.meta.glob<Caliber>('./*/caliber.ts', { eager: true, import: 'default' });

export const calibers: Record<string, Caliber> = {};
for (const [path, raw] of Object.entries(modules)) {
  const caliber = CaliberSchema.parse(raw);
  const errors = validateCaliber(caliber);
  if (errors.length > 0) throw new Error(`${path}\n${errors.join('\n')}`);
  calibers[caliber.id] = caliber;
}

export const DEFAULT_CALIBER = 'eta-2824-2';

export function getCaliber(id: string): Caliber | undefined {
  return calibers[id];
}
