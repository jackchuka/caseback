import type { LegacyConfig } from './config';

// The configs of watches still built by the legacy generator, keyed by watch id, for the legacy geometry tests.
const modules = import.meta.glob<LegacyConfig | undefined>('../../../../data/watches/*/*/exterior.ts', { eager: true, import: 'config' });

export const legacyConfigs: Record<string, LegacyConfig> = Object.fromEntries(
  Object.entries(modules)
    .filter((entry): entry is [string, LegacyConfig] => entry[1] !== undefined)
    .map(([path, config]) => [path.split('/').slice(-3, -1).join('/'), config]),
);
