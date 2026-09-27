import { useTranslation } from 'react-i18next';

export function Fallback() {
  const { t } = useTranslation();
  return (
    <main className="fallback" role="alert">
      <h1>{t('ui:fallback.title')}</h1>
      <p>{t('ui:fallback.body')}</p>
    </main>
  );
}
