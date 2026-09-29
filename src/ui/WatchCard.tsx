import { calibers } from '../../data/calibers';
import type { WatchMeta } from '../model/watch';
import { useApp } from '../state/app';
import { CatalogImage } from './CatalogImage';
import { hrefWatch } from './catalogLinks';

export function WatchCard({ watch }: { watch: WatchMeta }) {
  const lang = useApp((s) => s.lang);
  const caliber = calibers[watch.caliberId]!;
  return (
    <li className="watch">
      <a href={hrefWatch(watch.id, lang)}>
        <CatalogImage thumb={`watches/${watch.id}`} sizes="(max-width: 760px) 92vw, (max-width: 1100px) 46vw, 370px" fallback={watch.brand} />
        <div className="meta">
          <span className="kicker">{watch.brand}</span>
          <h3>{watch.model}</h3>
          <span className="sub">
            {watch.reference} · {caliber.name}
          </span>
        </div>
      </a>
    </li>
  );
}
