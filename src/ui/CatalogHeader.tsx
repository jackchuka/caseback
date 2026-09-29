import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../state/app';
import { hrefHome } from './catalogLinks';
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
      <div className="lang glass" role="group" aria-label="Language">
        {(['ja', 'en'] as const).map((l) => (
          <button key={l} type="button" data-lang={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </header>
  );
}
