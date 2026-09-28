import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { calibers, DEFAULT_CALIBER } from '../data/calibers';
import { getWatch, watches } from '../data/watches';
import { App } from './app/App';
import { detectQuality } from './app/quality';
import { hasWebGL } from './app/webgl';
import { legacyRedirect, parseLocation, parseRoute } from './app/url';
import { createI18n } from './i18n';
import { initAppStore } from './state/app';
import { CaliberWatches } from './ui/CaliberWatches';
import { Home } from './ui/Home';
import './ui/styles.css';

const base = import.meta.env.BASE_URL;
const redirect = legacyRedirect(location.pathname, location.search, base, DEFAULT_CALIBER);
if (redirect) location.replace(redirect);
else await start();

async function start() {
  // Vite replaces import.meta.env.DEV with false in production builds, which drops this branch and its chunk.
  if (import.meta.env.DEV && location.pathname.startsWith(`${base}dev/compare`)) {
    const { startCompare } = await import('./dev/start');
    await startCompare(base);
    return;
  }
  const route = parseRoute(location.pathname, base, calibers, watches);
  const caliberId = route.kind === 'home' ? DEFAULT_CALIBER : route.caliberId;
  const url = parseLocation({ pathname: `${base}calibers/${caliberId}`, search: location.search }, base, calibers, DEFAULT_CALIBER);
  const caliber = calibers[caliberId]!;
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

  const page =
    route.kind === 'home' ? (
      <Home />
    ) : route.kind === 'caliber-watches' ? (
      <CaliberWatches caliberId={route.caliberId} />
    ) : (
      <App caliber={caliber} i18n={i18n} webgl={hasWebGL()} watch={route.kind === 'watch' ? getWatch(route.watchId) : undefined} />
    );

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>{page}</I18nextProvider>
    </StrictMode>,
  );
}
