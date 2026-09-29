import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { calibers } from '../../data/calibers';
import { watches } from '../../data/watches';
import { createI18n } from '../i18n';
import { initAppStore } from '../state/app';
import '../ui/styles.css';
import './compare.css';
import { Compare, CompareIndex } from './Compare';
import { CaliberThumb, WatchThumb } from './Thumb';
import type { Shot } from './shots';

const shotModules = import.meta.glob<Shot[]>('../../data/watches/*/*/shots.ts', { eager: true, import: 'default' });
const shotsFor = (id: string) => shotModules[`../../data/watches/${id}/shots.ts`] ?? [];

export async function startDev(base: string) {
  if (location.pathname.startsWith(`${base}dev/thumb`)) await startThumb(base);
  else await startCompare(base);
}

// /dev/thumb                         → window.__thumbs lists what to render
// /dev/thumb/watches/<brand>/<model> → the watch three-quarter front, 960×960 at ?scale=1
// /dev/thumb/calibers/<id>           → the bare movement, 16:10
// Scripted by `npm run thumbs`.
async function startThumb(base: string) {
  const [kind, ...rest] = location.pathname.slice(`${base}dev/thumb`.length).replace(/^\/+|\/+$/g, '').split('/');
  const id = rest.join('/');
  const scale = Number(new URLSearchParams(location.search).get('scale') ?? 2);
  const watch = kind === 'watches' ? watches[id] : undefined;
  const caliber = calibers[watch?.caliberId ?? id];
  // Free mode shows the automatic works with the rotor lifted off; paused holds the pose.
  if (caliber) initAppStore(caliber, { mode: kind === 'calibers' ? 'free' : 'intro', stepIndex: 0, lang: 'en', theme: 'dark', quality: 'high', paused: true });
  window.__thumbs = { watches: Object.keys(watches).sort(), calibers: Object.keys(calibers).sort() };
  document.body.style.background = 'transparent';
  const i18n = await createI18n('en');
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        {watch && caliber ? <WatchThumb caliber={caliber} watch={watch} size={960 * scale} /> : kind === 'calibers' && caliber ? <CaliberThumb caliber={caliber} width={960 * scale} height={600 * scale} /> : null}
      </I18nextProvider>
    </StrictMode>,
  );
}

declare global {
  interface Window {
    __thumbs?: { watches: string[]; calibers: string[] };
  }
}

// /dev/compare                      → list of watches
// /dev/compare/<brand>/<model>?shot=<id>&view=front|side|three-quarter&mode=overlay|side|diff|model
async function startCompare(base: string) {
  const rel = location.pathname.slice(`${base}dev/compare`.length).replace(/^\/+|\/+$/g, '');
  const q = new URLSearchParams(location.search);
  const watch = rel ? watches[rel] : undefined;
  const caliber = calibers[watch?.caliberId ?? Object.keys(calibers)[0]!]!;
  // Intro mode shows the finished watch with the caseback on and the rotor hidden; paused keeps it still.
  initAppStore(caliber, { mode: 'intro', stepIndex: 0, lang: 'en', theme: 'dark', quality: 'high', paused: true });
  const i18n = await createI18n('en');
  const view = (['front', 'side', 'three-quarter'] as const).find((v) => v === q.get('view')) ?? 'front';
  const mode = (['overlay', 'side', 'diff', 'model'] as const).find((m) => m === q.get('mode')) ?? 'overlay';
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        {watch ? (
          <Compare caliber={caliber} watch={watch} shots={shotsFor(watch.id)} shotId={q.get('shot')} view={view} mode={mode} />
        ) : (
          <CompareIndex ids={Object.keys(watches).sort()} />
        )}
      </I18nextProvider>
    </StrictMode>,
  );
}
