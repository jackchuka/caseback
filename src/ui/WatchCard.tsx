import { useTranslation } from 'react-i18next';
import { calibers } from '../../data/calibers';
import type { WatchMeta } from '../model/watch';
import { useApp } from '../state/app';
import { hrefCaliber, hrefWatch } from './catalogLinks';

export function WatchCard({ watch }: { watch: WatchMeta }) {
  const { t } = useTranslation();
  const lang = useApp((s) => s.lang);
  const caliber = calibers[watch.caliberId]!;
  return (
    <li className="watch glass">
      <div className="kicker">{watch.brand}</div>
      <h3>
        <a href={hrefWatch(watch.id, lang)}>{watch.model}</a>
      </h3>
      <div className="sub">
        {watch.reference} · <a href={hrefCaliber(caliber.id, lang)}>{caliber.name}</a>
      </div>
      <p>{t(`watches:${watch.id}.summary`)}</p>
      <a className="cta" href={hrefWatch(watch.id, lang)}>
        {t('ui:home.openTour')} →
      </a>
    </li>
  );
}
