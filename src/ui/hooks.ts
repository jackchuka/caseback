import { useEffect } from 'react';
import type { i18n } from 'i18next';
import type { Caliber } from '../model/schema';
import { appStore, useApp } from '../state/app';
import { toSearch } from '../app/url';

export function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = appStore().getState();
      if (s.mode !== 'tour') return;
      if (e.key === 'ArrowRight') s.next();
      if (e.key === 'ArrowLeft') s.prev();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);
}

export function useUrlSync(caliber: Caliber) {
  const lang = useApp((s) => s.lang);
  const mode = useApp((s) => s.mode);
  const stepIndex = useApp((s) => s.stepIndex);
  useEffect(() => {
    const step = mode === 'tour' ? caliber.tour[stepIndex]! : null;
    history.replaceState(null, '', `${location.pathname}${toSearch(lang, step)}`);
  }, [caliber, lang, mode, stepIndex]);
}

export function useThemeAttr() {
  const theme = useApp((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
}

export function useI18nLang(i18n: i18n) {
  const lang = useApp((s) => s.lang);
  useEffect(() => {
    void i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
  }, [i18n, lang]);
}
