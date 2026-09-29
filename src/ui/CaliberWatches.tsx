import { useTranslation } from 'react-i18next';
import { calibers } from '../../data/calibers';
import { watchesForCaliber } from '../../data/watches/meta';
import { useApp } from '../state/app';
import { Notice } from './Notice';
import { CatalogHeader } from './CatalogHeader';
import { hrefCaliber } from './catalogLinks';
import { WatchCard } from './WatchCard';

export function CaliberWatches({ caliberId }: { caliberId: string }) {
  const { t } = useTranslation();
  const lang = useApp((s) => s.lang);
  const caliber = calibers[caliberId]!;
  return (
    <main className="caliber-watches catalog">
      <CatalogHeader />
      <h1>{t('ui:home.watchesWith', { name: caliber.name })}</h1>
      <a className="cta" href={hrefCaliber(caliber.id, lang)}>
        {caliber.name} · {t('ui:home.openTour')} →
      </a>
      <ul className="cards">
        {watchesForCaliber(caliberId).map((w) => (
          <WatchCard key={w.id} watch={w} />
        ))}
      </ul>
      <footer className="catalog-footer">
        <Notice />
      </footer>
    </main>
  );
}
