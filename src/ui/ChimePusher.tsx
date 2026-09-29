import { useTranslation } from 'react-i18next';
import { useApp } from '../state/app';

// The strike's pusher at 4 o'clock: each press toggles between chiming and silent.
export function ChimePusher() {
  const { t } = useTranslation();
  const presses = useApp((s) => s.pushes.chime);
  const press = useApp((s) => s.press);
  const silent = presses % 2 === 1;
  return (
    <div className="chime-ctl" data-state={silent ? 'silent' : 'on'}>
      <button type="button" className="toggle" aria-pressed={silent} title={t('ui:chime.pusher')} onClick={() => press('chime')}>
        {t(silent ? 'ui:chime.silent' : 'ui:chime.on')}
      </button>
    </div>
  );
}
