import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../state/app';
import { hrefHome, REPO_URL } from './catalogLinks';
import { useThemeAttr } from './hooks';
import { Logo } from './Logo';

export function CatalogHeader() {
  const { t, i18n } = useTranslation();
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);
  useThemeAttr();
  useEffect(() => {
    void i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    const q = new URLSearchParams(location.search);
    q.set('lang', lang);
    history.replaceState(null, '', `${location.pathname}?${q.toString()}`);
  }, [i18n, lang]);
  return (
    <header className="catalog-header">
      <a className="brand" href={hrefHome(lang)}>
        <span className="brand-name">
          <Logo />
          {t('ui:brand')}
        </span>
        <small>{t('ui:tagline')}</small>
      </a>
      <div className="header-actions">
        <a className="github glass" href={REPO_URL} aria-label="GitHub">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
        </a>
        <div className="lang glass" role="group" aria-label="Language">
          {(['ja', 'en'] as const).map((l) => (
            <button key={l} type="button" data-lang={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
