import { useTranslation } from 'react-i18next';

export function Fallback({ reason, overlay = false }: { reason: string; overlay?: boolean }) {
  const { t } = useTranslation();
  return (
    <main className={overlay ? 'fallback overlay' : 'fallback'} role="alert">
      <h1>{t('ui:fallback.title')}</h1>
      <p>{t('ui:fallback.body')}</p>
      <p className="fallback-reason">{reason}</p>
    </main>
  );
}
