import { useTranslation } from 'react-i18next';
import { useApp } from '../state/app';

export function Hint() {
  const { t } = useTranslation();
  const mode = useApp((s) => s.mode);
  if (mode !== 'tour' && mode !== 'free') return null;
  return <div className="hint">{t(`ui:hint.${mode}`)}</div>;
}
