import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calibers } from '../../data/calibers';
import { watchesForCaliber, watchMetas } from '../../data/watches/meta';
import { searchCatalog } from '../app/catalog';
import { useApp } from '../state/app';
import { CatalogHeader } from './CatalogHeader';
import { CatalogImage } from './CatalogImage';
import { hrefCaliber, hrefCaliberWatches, hrefWatch } from './catalogLinks';
import { useDisplayFont } from './displayFont';
import { Contribute } from './Contribute';
import { Notice } from './Notice';
import { WatchCard } from './WatchCard';

const HERO_WATCH = 'tudor/heritage-black-bay-79220b';

export function Home() {
  const { t } = useTranslation();
  const lang = useApp((s) => s.lang);
  const [q, setQ] = useState('');
  const found = searchCatalog(q, Object.values(calibers), Object.values(watchMetas));
  const headline = t('ui:home.headline');
  useDisplayFont(headline + t('ui:home.calibers') + t('ui:home.watches'));
  return (
    <main className="home catalog">
      <CatalogHeader />
      <section className="hero">
        <div className="copy">
          <h1>
            {headline.split('\n').map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </h1>
          <p>{t('ui:home.lede', { watches: Object.keys(watchMetas).length, calibers: Object.keys(calibers).length })}</p>
          <a className="hero-cta" href="#watches">
            {t('ui:home.choose')} →
          </a>
        </div>
        <a className="hero-figure" href={hrefWatch(HERO_WATCH, lang)} tabIndex={-1} aria-hidden="true">
          <CatalogImage thumb={`watches/${HERO_WATCH}`} sizes="(max-width: 760px) 100vw, 640px" fallback="" priority />
        </a>
      </section>
      <section className="shelf" aria-labelledby="calibers-heading">
        <div className="shelf-head">
          <h2 id="calibers-heading">{t('ui:home.calibers')}</h2>
          <input className="search" type="search" aria-label={t('ui:home.search')} placeholder={t('ui:home.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <ul className="caliber-grid">
          {found.calibers.map((c) => (
            <li key={c.id} className="caliber">
              <a className="cover" href={hrefCaliber(c.id, lang)}>
                <CatalogImage thumb={`calibers/${c.id}`} sizes="(max-width: 760px) 92vw, 370px" fallback={c.name} />
                <h3>{c.name}</h3>
                <span className="sub">{t('ui:home.caliberSpecs', { d: c.specs.diameterMm, j: c.specs.jewels, v: c.specs.vph.toLocaleString() })}</span>
              </a>
              <a className="count" href={hrefCaliberWatches(c.id, lang)}>
                {t('ui:home.watchCount', { count: watchesForCaliber(c.id).length })} →
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section className="shelf" id="watches" aria-labelledby="watches-heading">
        <div className="shelf-head">
          <h2 id="watches-heading">{t('ui:home.watches')}</h2>
          <span className="sub">{t('ui:home.watchTotal', { count: found.watches.length })}</span>
        </div>
        <ul className="gallery">
          {found.watches.map((w) => (
            <WatchCard key={w.id} watch={w} />
          ))}
        </ul>
      </section>
      <footer className="catalog-footer">
        <Contribute />
        <Notice />
      </footer>
    </main>
  );
}
