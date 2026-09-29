import { useTranslation } from 'react-i18next';
import { REPO_URL } from './catalogLinks';

export function Contribute() {
  const { t } = useTranslation();
  return (
    <section className="contribute" aria-labelledby="contribute-heading">
      <h2 id="contribute-heading">{t('ui:contribute.title')}</h2>
      <p>{t('ui:contribute.body')}</p>
      <ul>
        <li>
          <a href={`${REPO_URL}/issues/new?template=watch-request.yml`}>{t('ui:contribute.request')} →</a>
        </li>
        <li>
          <a href={`${REPO_URL}/issues/new?template=correction.yml`}>{t('ui:contribute.correction')} →</a>
        </li>
        <li>
          <a href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}>{t('ui:contribute.guide')} →</a>
        </li>
        <li>
          <a href={REPO_URL}>{t('ui:contribute.repo')} →</a>
        </li>
      </ul>
    </section>
  );
}
