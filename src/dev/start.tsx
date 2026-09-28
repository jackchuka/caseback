import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { calibers } from '../../data/calibers';
import { watches } from '../../data/watches';
import { createI18n } from '../i18n';
import { initAppStore } from '../state/app';
import '../ui/styles.css';
import './compare.css';
import { Compare, CompareIndex, type Mode } from './Compare';
import type { Shot, View } from './shots';

const shotModules = import.meta.glob<Shot[]>('../../data/watches/*/*/shots.ts', { eager: true, import: 'default' });
const shotsFor = (id: string) => shotModules[`../../data/watches/${id}/shots.ts`] ?? [];

// /dev/compare                      → list of watches
// /dev/compare/<brand>/<model>?shot=<id>&view=front|side|three-quarter&mode=overlay|side|diff|model
export async function startCompare(base: string) {
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
          <Compare caliber={caliber} watch={watch} shots={shotsFor(watch.id)} shotId={q.get('shot')} view={view as View} mode={mode as Mode} />
        ) : (
          <CompareIndex ids={Object.keys(watches).sort()} />
        )}
      </I18nextProvider>
    </StrictMode>,
  );
}
