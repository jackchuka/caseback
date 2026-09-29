import { useTranslation } from 'react-i18next';
import { calibers } from '../../data/calibers';
import { watchesForCaliber } from '../../data/watches/meta';
import { useApp } from '../state/app';
import { CatalogHeader } from './CatalogHeader';
import { hrefCaliber } from './catalogLinks';
import { useDisplayFont } from './displayFont';
import { Notice } from './Notice';
import { WatchCard } from './WatchCard';

export function CaliberWatches({ caliberId }: { caliberId: string }) {
  const { t } = useTranslation();
  const lang = useApp((s) => s.lang);
  const caliber = calibers[caliberId]!;
  const title = t('ui:home.watchesWith', { name: caliber.name });
  useDisplayFont(title);
  return (
    <main className="caliber-watches catalog">
      <CatalogHeader />
      <section className="shelf">
        <div className="shelf-head">
          <h1>{title}</h1>
          <a className="cta" href={hrefCaliber(caliber.id, lang)}>
            {caliber.name} · {t('ui:home.openTour')} →
          </a>
        </div>
        <ul className="gallery">
          {watchesForCaliber(caliberId).map((w) => (
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
