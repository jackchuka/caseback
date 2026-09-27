import type { Lang } from '../state/store';

const base = import.meta.env.BASE_URL;

export const hrefHome = (lang: Lang) => `${base}?lang=${lang}`;
export const hrefCaliber = (id: string, lang: Lang) => `${base}calibers/${id}?lang=${lang}`;
export const hrefCaliberWatches = (id: string, lang: Lang) => `${base}calibers/${id}/watches?lang=${lang}`;
export const hrefWatch = (id: string, lang: Lang) => `${base}watches/${id}?lang=${lang}`;
