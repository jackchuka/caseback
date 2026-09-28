import { useTranslation } from 'react-i18next';
import type { Caliber } from '../model/schema';
import { useApp } from '../state/app';
import { ChronoPushers } from './ChronoPushers';

export function Dock({ caliber }: { caliber: Caliber }) {
  const { t } = useTranslation();
  const mode = useApp((s) => s.mode);
  const explode = useApp((s) => s.explode);
  const speedExp = useApp((s) => s.freeSpeedExp);
  const paused = useApp((s) => s.paused);
  const { setMode, setExplode, setFreeSpeedExp, togglePaused, toggleSide } = useApp((s) => s);
  const speed = 10 ** speedExp;
  return (
    <div className={`dock glass ${mode === 'free' ? '' : 'hidden'}`}>
      <button
        type="button"
        className="mode to-tour"
        onClick={() => {
          setExplode(0);
          setMode('tour');
        }}
      >
        {t('ui:dock.back')}
      </button>
      <button type="button" className="mode flip" onClick={toggleSide}>
        {t('ui:dock.flip')}
      </button>
      <span className="sep" />
      <label>
        {t('ui:dock.explode')}
        <input type="range" min={0} max={1} step={0.001} value={explode} onChange={(e) => setExplode(+e.target.value)} />
      </label>
      <label>
        {t('ui:dock.speed')}
        <input type="range" min={-2} max={1} step={0.01} value={speedExp} onChange={(e) => setFreeSpeedExp(+e.target.value)} />
        <output>{speed < 1 ? speed.toFixed(2) : speed.toFixed(1)}×</output>
      </label>
      <button type="button" className="mode" aria-label={paused ? t('ui:tour.play') : t('ui:tour.pause')} onClick={togglePaused}>
        {paused ? '▶' : '❚❚'}
      </button>
      {caliber.couplings.some((cp) => cp.type === 'chronograph') && (
        <>
          <span className="sep" />
          <ChronoPushers />
        </>
      )}
    </div>
  );
}
