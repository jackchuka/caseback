import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { calibers, DEFAULT_CALIBER } from '../data/calibers';
import { App } from './app/App';
import { detectQuality } from './app/quality';
import { parseLocation } from './app/url';
import { createI18n } from './i18n';
import { initAppStore } from './state/app';
import './ui/styles.css';

const url = parseLocation(location, import.meta.env.BASE_URL, calibers, DEFAULT_CALIBER);
const caliber = calibers[url.caliberId]!;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lang = url.lang ?? (navigator.language.startsWith('ja') ? 'ja' : 'en');
const skipIntro = reducedMotion || url.stepIndex !== null;

initAppStore(caliber, {
  mode: skipIntro ? 'tour' : 'intro',
  stepIndex: url.stepIndex ?? 0,
  lang,
  theme: matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark',
  quality: detectQuality(),
  paused: reducedMotion,
});
const i18n = await createI18n(lang);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App caliber={caliber} i18n={i18n} />
    </I18nextProvider>
  </StrictMode>,
);
