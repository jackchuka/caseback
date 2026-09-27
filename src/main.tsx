import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { DEFAULT_CALIBER, getCaliber } from '../data/calibers';
import { App } from './app/App';
import { detectQuality } from './app/quality';
import { createI18n } from './i18n';
import { initAppStore } from './state/app';

const caliber = getCaliber(DEFAULT_CALIBER)!;
initAppStore(caliber, { mode: 'free', quality: detectQuality() });
const i18n = await createI18n('ja');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App caliber={caliber} />
    </I18nextProvider>
  </StrictMode>,
);
