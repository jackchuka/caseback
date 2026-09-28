import { useTranslation } from 'react-i18next';
import { useApp } from '../state/app';

// The chronograph's two pushers: start/stop at 2 o'clock, reset at 4.
export function ChronoPushers() {
  const { t } = useTranslation();
  const chrono = useApp((s) => s.chrono);
  const press = useApp((s) => s.pressChrono);
  return (
    <div className="chrono-ctl" data-state={chrono}>
      <button type="button" className="start-stop" aria-pressed={chrono === 'running'} title={t('ui:chrono.pusherStart')} onClick={() => press('start-stop')}>
        {t('ui:chrono.startStop')}
      </button>
      <button type="button" className="reset" title={t('ui:chrono.pusherReset')} onClick={() => press('reset')}>
        {t('ui:chrono.reset')}
      </button>
    </div>
  );
}
