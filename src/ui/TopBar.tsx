import { useTranslation } from 'react-i18next';
import type { Caliber } from '../model/schema';
import { useApp } from '../state/app';

export function TopBar({ caliber }: { caliber: Caliber }) {
  const { t } = useTranslation();
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  return (
    <header className="topbar">
      <div className="brand">
        {t('ui:brand')}
        <small>
          {caliber.name} · {t('ui:tagline')}
        </small>
      </div>
      <div className="controls">
        <div className="lang glass" role="group" aria-label="Language">
          {(['ja', 'en'] as const).map((l) => (
            <button key={l} type="button" data-lang={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <button type="button" className="theme glass" aria-label={t('ui:theme')} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          ◐
        </button>
      </div>
    </header>
  );
}
