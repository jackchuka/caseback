import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { caliberVars } from '../i18n/caliberVars';
import type { Caliber } from '../model/schema';
import { useApp } from '../state/app';
import { ChimePusher } from './ChimePusher';
import { ChronoPushers } from './ChronoPushers';
import { panelModel } from './panel';
import { useOccluder } from './useOccluder';

// How far a drag on the sheet's handle must travel to open or close it rather than count as a tap.
const DRAG = 24;

export function InfoPanel({ caliber }: { caliber: Caliber }) {
  const { t } = useTranslation();
  const mode = useApp((s) => s.mode);
  const stepIndex = useApp((s) => s.stepIndex);
  const selected = useApp((s) => s.selected);
  const lang = useApp((s) => s.lang);
  const reserveH = useApp((s) => Math.round(s.reserveH * 10) / 10);
  const crownPos = useApp((s) => s.crownPos);
  const chrono = useApp((s) => s.chrono);
  const chimePresses = useApp((s) => s.pushes.chime);
  const setCrownPos = useApp((s) => s.setCrownPos);
  const setTurning = useApp((s) => s.setTurning);
  const ctl = mode === 'tour' ? caliber.tour[stepIndex]!.ctl : undefined;
  const turning = useApp((s) => s.turning);
  // Pointer capture is lost silently when the button unmounts; stop turning on any release or blur, and on unmount.
  useEffect(() => {
    if (!turning) return;
    const stop = () => setTurning(false);
    addEventListener('pointerup', stop);
    addEventListener('pointercancel', stop);
    addEventListener('blur', stop);
    return () => {
      removeEventListener('pointerup', stop);
      removeEventListener('pointercancel', stop);
      removeEventListener('blur', stop);
    };
  }, [turning, setTurning]);
  useEffect(() => () => setTurning(false), [setTurning]);
  const m = panelModel(caliber, mode, stepIndex, selected);
  const ref = useOccluder<HTMLElement>(!!m);
  // On a phone the panel is a bottom sheet: collapsed to its heading and one line until the handle opens it.
  const [open, setOpen] = useState(false);
  const drag = useRef<{ y: number; moved: boolean } | null>(null);
  if (!m) return <aside className="info glass hidden" aria-hidden ref={ref} />;
  const vars = caliberVars(caliber);
  return (
    <aside className={`info glass ${open ? 'open' : ''}`} aria-live="polite" ref={ref}>
      <button
        type="button"
        className="grab"
        aria-expanded={open}
        aria-label={t(open ? 'ui:sheet.collapse' : 'ui:sheet.expand')}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { y: e.clientY, moved: false };
        }}
        onPointerUp={(e) => {
          const dy = e.clientY - (drag.current?.y ?? e.clientY);
          if (Math.abs(dy) < DRAG) return;
          drag.current = { y: e.clientY, moved: true };
          setOpen(dy < 0);
        }}
        onClick={() => {
          if (!drag.current?.moved) setOpen((o) => !o);
          drag.current = null;
        }}
      >
        <i />
      </button>
      {m.kickerKey && <div className="kicker">{t(m.kickerKey)}</div>}
      <h1>{t(m.titleKey)}</h1>
      {m.subtitleKey && lang === 'ja' && <div className="sub">{t(m.subtitleKey)}</div>}
      <p>{t(m.bodyKey, vars)}</p>
      {m.stats.length > 0 && (
        <div className="stats">
          {m.stats.map((s) => (
            <div key={s.label}>
              {t(`ui:stats.${s.label}`)}
              <b>
                {s.value === 'live:reserve'
                  ? t('ui:reserveUnit', { h: reserveH.toFixed(1) })
                  : s.value === 'live:crown'
                    ? t(`ui:crown.pos${crownPos}`)
                    : s.value === 'live:chrono'
                      ? t(`ui:chrono.${chrono === 'reset' ? 'zero' : chrono}`)
                      : s.value === 'live:chime'
                        ? t(chimePresses % 2 === 1 ? 'ui:chime.silent' : 'ui:chime.on')
                        : s.value}
              </b>
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
      {ctl === 'chrono' && <ChronoPushers />}
      {ctl === 'chime' && <ChimePusher />}
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
            <li className="note">{t('ui:notice.full')}</li>
          </ul>
        </details>
      )}
    </aside>
  );
}
