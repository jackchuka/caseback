import { useTranslation } from 'react-i18next';
import type { Caliber } from '../model/schema';
import type { Watch } from '../model/watch';
import { useApp } from '../state/app';
import { hrefHome } from './catalogLinks';
import { useOccluder } from './useOccluder';
import { Logo } from './Logo';

export function TopBar({ caliber, watch }: { caliber: Caliber; watch?: Watch }) {
  const { t } = useTranslation();
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const ref = useOccluder<HTMLElement>(true);
  return (
    <header className="topbar" ref={ref}>
      <a className="brand" href={hrefHome(lang)}>
        <span className="brand-name">
          <Logo />
          {t('ui:brand')}
        </span>
        <small>
          {watch ? `${watch.brand} ${watch.model} · ${caliber.name}` : caliber.name} · {t('ui:tagline')}
        </small>
      </a>
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
