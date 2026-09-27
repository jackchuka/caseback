import { useTranslation } from 'react-i18next';
import type { Caliber } from '../model/schema';
import { useApp } from '../state/app';
import { chapterSteps } from '../tour/engine';

export function TourBar({ caliber }: { caliber: Caliber }) {
  const { t } = useTranslation();
  const mode = useApp((s) => s.mode);
  const stepIndex = useApp((s) => s.stepIndex);
  const paused = useApp((s) => s.paused);
  const { goStep, next, prev, setMode, togglePaused } = useApp((s) => s);
  const current = caliber.tour[stepIndex]!;
  const ns = caliber.id;
  return (
    <nav className={`tourbar glass ${mode === 'tour' ? '' : 'hidden'}`} aria-label={t('ui:tour.label')}>
      <div className="chapters">
        {caliber.chapters.map((ch) => (
          <button key={ch.id} type="button" aria-current={ch.id === current.chapter} onClick={() => goStep(chapterSteps(caliber.tour, ch.id)[0]!)}>
            {t(`${ns}:chapters.${ch.id}.title`)}
          </button>
        ))}
      </div>
      <div className="row">
        <button type="button" className="nav prev" aria-label={t('ui:tour.prev')} onClick={prev}>
          ‹
        </button>
        <ol className="steps">
          {chapterSteps(caliber.tour, current.chapter).map((i) => {
            const s = caliber.tour[i]!;
            return (
              <li key={s.id} className={i === stepIndex ? 'on' : i < stepIndex ? 'done' : ''}>
                <button type="button" aria-current={i === stepIndex ? 'step' : undefined} onClick={() => goStep(i)}>
                  <i />
                  <span>{s.focus ? t(`${ns}:parts.${s.focus}.name`) : t('ui:tour.overview')}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <button type="button" className="nav next" aria-label={t('ui:tour.next')} onClick={next}>
          ›
        </button>
        <span className="sep" />
        <button type="button" className="mode" aria-label={paused ? t('ui:tour.play') : t('ui:tour.pause')} onClick={togglePaused}>
          {paused ? '▶' : '❚❚'}
        </button>
        <button type="button" className="mode to-free" onClick={() => setMode('free')}>
          {t('ui:tour.free')}
        </button>
      </div>
    </nav>
  );
}
