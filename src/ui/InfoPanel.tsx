import { useTranslation } from 'react-i18next';
import { caliberVars } from '../i18n/caliberVars';
import type { Caliber } from '../model/schema';
import { useApp } from '../state/app';
import { panelModel } from './panel';

export function InfoPanel({ caliber }: { caliber: Caliber }) {
  const { t } = useTranslation();
  const mode = useApp((s) => s.mode);
  const stepIndex = useApp((s) => s.stepIndex);
  const selected = useApp((s) => s.selected);
  const lang = useApp((s) => s.lang);
  const reserveH = useApp((s) => Math.round(s.reserveH * 10) / 10);
  const crownPos = useApp((s) => s.crownPos);
  const setCrownPos = useApp((s) => s.setCrownPos);
  const setTurning = useApp((s) => s.setTurning);
  const ctl = mode === 'tour' ? caliber.tour[stepIndex]!.ctl : undefined;
  const m = panelModel(caliber, mode, stepIndex, selected);
  if (!m) return <aside className="info glass hidden" aria-hidden />;
  const vars = caliberVars(caliber);
  return (
    <aside className="info glass" aria-live="polite">
      {m.kickerKey && <div className="kicker">{t(m.kickerKey)}</div>}
      <h1>{t(m.titleKey)}</h1>
      {m.subtitleKey && lang === 'ja' && <div className="sub">{t(m.subtitleKey)}</div>}
      <p>{t(m.bodyKey, vars)}</p>
      {m.stats.length > 0 && (
        <div className="stats">
          {m.stats.map((s) => (
            <div key={s.label}>
              {t(`ui:stats.${s.label}`)}
              <b>{s.value === 'live:reserve' ? t('ui:reserveUnit', { h: reserveH.toFixed(1) }) : s.value === 'live:crown' ? t(`ui:crown.pos${crownPos}`) : s.value}</b>
            </div>
          ))}
        </div>
      )}
      {ctl === 'crown' && (
        <div className="crown-ctl">
          <div className="seg" role="radiogroup">
            {([0, 1, 2] as const).map((p) => (
              <button key={p} type="button" role="radio" aria-checked={crownPos === p} onClick={() => setCrownPos(p)}>
                {t(`ui:crown.pos${p}`)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="turn"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setTurning(true);
            }}
            onPointerUp={() => setTurning(false)}
            onPointerCancel={() => setTurning(false)}
            onLostPointerCapture={() => setTurning(false)}
          >
            {t('ui:crown.turn')}
          </button>
        </div>
      )}
      {m.speed && <div className="badge">{t('ui:speedBadge', { speed: m.speed.toLocaleString() })}</div>}
      {m.estimated && <div className="badge">{t('ui:estimated')}</div>}
      {(m.sources.length > 0 || m.notes.length > 0) && (
        <details className="sources">
          <summary>{t('ui:sources')}</summary>
          <ul>
            {m.sources.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>
              </li>
            ))}
            {m.notes.map((n) => (
              <li key={n} className="note">
                {n}
              </li>
            ))}
          </ul>
        </details>
      )}
    </aside>
  );
}
