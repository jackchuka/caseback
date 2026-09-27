import i18next, { type i18n } from 'i18next';
import type { Lang } from '../state/store';

const files = import.meta.glob<Record<string, unknown>>('../content/*/*.json', { eager: true, import: 'default' });

const resources: Record<string, Record<string, Record<string, unknown>>> = {};
for (const [path, data] of Object.entries(files)) {
  const [, lang, file] = path.match(/content\/([a-z]+)\/(.+)\.json$/)!;
  (resources[lang!] ??= {})[file!] = data;
}

export async function createI18n(lang: Lang): Promise<i18n> {
  const instance = i18next.createInstance();
  await instance.init({
    lng: lang,
    fallbackLng: 'ja',
    resources,
    ns: Object.keys(resources.ja ?? {}),
    defaultNS: 'ui',
    interpolation: { escapeValue: false },
  });
  return instance;
}
