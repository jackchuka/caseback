import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Caliber } from '../model/schema';
import { useApp } from '../state/app';
import { chapterSteps } from '../tour/engine';
import { useOccluder } from './useOccluder';

// Scrolls a strip (positioned, so it is the offsetParent) sideways to centre its current item; never scrolls the page.
function centre(strip: Element | null | undefined, item: Element | null | undefined) {
  if (!(strip instanceof HTMLElement) || !(item instanceof HTMLElement) || strip.scrollWidth <= strip.clientWidth) return;
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  strip.scrollTo({ left: item.offsetLeft - (strip.clientWidth - item.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
}

export function TourBar({ caliber }: { caliber: Caliber }) {
  const { t } = useTranslation();
  const mode = useApp((s) => s.mode);
  const stepIndex = useApp((s) => s.stepIndex);
  const paused = useApp((s) => s.paused);
  const goStep = useApp((s) => s.goStep);
  const next = useApp((s) => s.next);
  const prev = useApp((s) => s.prev);
  const setMode = useApp((s) => s.setMode);
  const togglePaused = useApp((s) => s.togglePaused);
  const current = caliber.tour[stepIndex]!;
  const ns = caliber.id;
  const ref = useOccluder<HTMLElement>(mode === 'tour', '--bar-h');
  useEffect(() => {
    const bar = ref.current;
    centre(bar?.querySelector('.chapters'), bar?.querySelector('.chapters [aria-current="true"]'));
    centre(bar?.querySelector('.steps'), bar?.querySelector('.steps li.on'));
  }, [ref, current.chapter, stepIndex]);
  return (
    <nav className={`tourbar glass ${mode === 'tour' ? '' : 'hidden'}`} aria-label={t('ui:tour.label')} ref={ref}>
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
