import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Caliber } from '../model/schema';
import type { Side } from '../scene/focus';

export type Mode = 'intro' | 'opening' | 'tour' | 'free';
export type Theme = 'dark' | 'light';
export type Lang = 'ja' | 'en';
export type Quality = 'high' | 'low';

export type InitState = { mode: Mode; stepIndex: number; lang: Lang; theme: Theme; quality: Quality; paused: boolean };

export type AppState = InitState & {
  caliberId: string;
  selected: string | null;
  explode: number;
  freeSpeedExp: number;
  freeSide: Side;
  reserveH: number;
  setReserve(h: number): void;
  setMode(m: Mode): void;
  toggleSide(): void;
  goStep(i: number): void;
  next(): void;
  prev(): void;
  pick(focus: string): void;
  setExplode(v: number): void;
  setFreeSpeedExp(v: number): void;
  togglePaused(): void;
  setTheme(t: Theme): void;
  setLang(l: Lang): void;
  finishOpening(): void;
};

export type AppStore = StoreApi<AppState>;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function createAppStore(caliber: Caliber, init: Partial<InitState> = {}): AppStore {
  const last = caliber.tour.length - 1;
  return createStore<AppState>()((set, get) => ({
    caliberId: caliber.id,
    mode: init.mode ?? 'intro',
    stepIndex: clamp(init.stepIndex ?? 0, 0, last),
    lang: init.lang ?? 'ja',
    theme: init.theme ?? 'dark',
    quality: init.quality ?? 'high',
    paused: init.paused ?? false,
    selected: null,
    explode: 0,
    freeSpeedExp: -1,
    freeSide: 'back',
    reserveH: 0.45 * caliber.specs.powerReserveH,
    setReserve: (reserveH) => set({ reserveH }),
    setMode: (mode) =>
      set(mode === 'free' ? { mode, selected: null, freeSide: caliber.tour[get().stepIndex]!.side } : { mode }),
    toggleSide: () => set({ freeSide: get().freeSide === 'back' ? 'dial' : 'back' }),
    goStep: (i) => set({ stepIndex: clamp(Math.round(i), 0, last) }),
    next: () => get().goStep(get().stepIndex + 1),
    prev: () => get().goStep(get().stepIndex - 1),
    pick: (focus) => {
      if (get().mode === 'tour') {
        const i = caliber.tour.findIndex((s) => s.focus === focus);
        if (i >= 0) return set({ stepIndex: i });
        return set({ mode: 'free', selected: focus, freeSide: caliber.tour[get().stepIndex]!.side });
      }
      if (get().mode === 'free') set({ selected: focus });
    },
    setExplode: (v) => set({ explode: clamp(v, 0, 1) }),
    setFreeSpeedExp: (v) => set({ freeSpeedExp: clamp(v, -2, 1) }),
    togglePaused: () => set({ paused: !get().paused }),
    setTheme: (theme) => set({ theme }),
    setLang: (lang) => set({ lang }),
    finishOpening: () => set({ mode: 'tour' }),
  }));
}
