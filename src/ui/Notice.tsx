import { useTranslation } from 'react-i18next';

// The site's standing disclaimer: no brand affiliation, and the models are approximations.
export function Notice({ short = false }: { short?: boolean }) {
  const { t } = useTranslation();
  return <p className="notice">{t(short ? 'ui:notice.short' : 'ui:notice.full')}</p>;
}
