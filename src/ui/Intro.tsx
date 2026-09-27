import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Caliber } from '../model/schema';
import type { Watch } from '../model/watch';
import { introFacts } from './introFacts';
import { appStore, useApp } from '../state/app';

export function Intro({ caliber, watch }: { caliber: Caliber; watch?: Watch }) {
  const { t } = useTranslation();
  const mode = useApp((s) => s.mode);
  const facts = introFacts(caliber, watch);
  const open = () => {
    if (appStore().getState().mode === 'intro') appStore().getState().setMode('opening');
  };

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) open();
    };
    addEventListener('wheel', onWheel, { passive: true });
    return () => removeEventListener('wheel', onWheel);
  }, []);

  return (
    <section className={`intro ${mode === 'intro' ? '' : 'hidden'}`} aria-hidden={mode !== 'intro'}>
      <div className="eyebrow">{t('ui:intro.eyebrow', { name: watch ? `${watch.brand} ${watch.model} · ${facts.name}` : facts.name })}</div>
      <h2>{t('ui:intro.title')}</h2>
      <p>{t('ui:intro.body', { diameter: facts.diameter, beats: facts.beats })}</p>
      {facts.base && <p className="base">{t('ui:intro.base', { base: facts.base })}</p>}
      <button type="button" onClick={open}>
        {t('ui:intro.open')}
      </button>
      <div className="scroll">{t('ui:intro.scroll')}</div>
    </section>
  );
}
