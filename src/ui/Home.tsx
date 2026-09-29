import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calibers } from '../../data/calibers';
import { watches, watchesForCaliber } from '../../data/watches';
import { searchCatalog } from '../app/catalog';
import { useApp } from '../state/app';
import { CatalogHeader } from './CatalogHeader';
import { Notice } from './Notice';
import { hrefCaliber, hrefCaliberWatches } from './catalogLinks';
import { WatchCard } from './WatchCard';

export function Home() {
  const { t } = useTranslation();
  const lang = useApp((s) => s.lang);
  const [q, setQ] = useState('');
  const found = searchCatalog(q, Object.values(calibers), Object.values(watches));
  return (
    <main className="home catalog">
      <CatalogHeader />
      <h1>{t('ui:home.title')}</h1>
      <input className="search glass" type="search" aria-label={t('ui:home.search')} placeholder={t('ui:home.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <section>
        <h2>{t('ui:home.calibers')}</h2>
        <ul className="cards">
          {found.calibers.map((c) => (
            <li key={c.id} className="caliber glass">
              <h3>
                <a href={hrefCaliber(c.id, lang)}>{c.name}</a>
              </h3>
              <div className="sub">{t('ui:home.caliberSpecs', { d: c.specs.diameterMm, j: c.specs.jewels, v: c.specs.vph.toLocaleString() })}</div>
              <a className="cta" href={hrefCaliber(c.id, lang)}>
                {t('ui:home.openTour')} →
              </a>
              <a className="cta" href={hrefCaliberWatches(c.id, lang)}>
                {t('ui:home.watchCount', { count: watchesForCaliber(c.id).length })}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>{t('ui:home.watches')}</h2>
        <ul className="cards">
          {found.watches.map((w) => (
            <WatchCard key={w.id} watch={w} />
          ))}
        </ul>
      </section>
      <footer className="catalog-footer">
        <Notice />
      </footer>
    </main>
  );
}
