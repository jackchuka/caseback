import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Caliber } from '../model/schema';
import { appStore, useApp } from '../state/app';

export function Intro({ caliber }: { caliber: Caliber }) {
  const { t } = useTranslation();
  const mode = useApp((s) => s.mode);
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
      <div className="eyebrow">{t('ui:intro.eyebrow', { name: caliber.name })}</div>
      <h2>{t('ui:intro.title')}</h2>
      <p>{t('ui:intro.body', { diameter: caliber.specs.diameterMm, beats: caliber.specs.vph / 3600 })}</p>
      <button type="button" onClick={open}>
        {t('ui:intro.open')}
      </button>
      <div className="scroll">{t('ui:intro.scroll')}</div>
    </section>
  );
}
