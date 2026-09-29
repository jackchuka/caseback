import { createStore, type StoreApi } from 'zustand/vanilla';
import { nextMode, type ChronoMode } from '../kinematics/chronograph';
import { initialReserveH } from '../kinematics/winding';
import type { Caliber, PusherAction } from '../model/schema';
import type { Side } from '../scene/focus';

export type Mode = 'intro' | 'opening' | 'tour' | 'free';
export type Theme = 'dark' | 'light';
export type Lang = 'ja' | 'en';
export type Quality = 'high' | 'low';

export type InitState = { mode: Mode; stepIndex: number; lang: Lang; theme: Theme; quality: Quality; paused: boolean };

export type AppState = InitState & {
  selected: string | null;
  explode: number;
  freeSpeedExp: number;
  freeSide: Side;
  reserveH: number;
  crownPos: 0 | 1 | 2;
  turning: boolean;
  // The chronograph's state and how many times each pusher has been pressed (the case's pushers move on every press,
  // even one the chronograph ignores; each start/stop press steps the cam, each chime press the strike's column wheel).
  chrono: ChronoMode;
  pushes: Record<PusherAction, number>;
  press(action: PusherAction): void;
  setCrownPos(p: 0 | 1 | 2): void;
  setTurning(b: boolean): void;
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
};

export type AppStore = StoreApi<AppState>;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
// Leaving crown controls pushes the crown in, so the watch never stays stopped by accident.
const PUSH_IN = { crownPos: 0 as const, turning: false };

export function createAppStore(caliber: Caliber, init: Partial<InitState> = {}): AppStore {
  const last = caliber.tour.length - 1;
  return createStore<AppState>()((set, get) => {
    const enterFree = (selected: string | null) => ({ mode: 'free' as const, selected, freeSide: caliber.tour[get().stepIndex]!.side, ...PUSH_IN });
    return {
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
      reserveH: initialReserveH(caliber),
      setReserve: (reserveH) => {
        if (reserveH !== get().reserveH) set({ reserveH });
      },
      crownPos: 0,
      turning: false,
      setCrownPos: (crownPos) => set({ crownPos }),
      chrono: 'reset',
      pushes: { 'start-stop': 0, reset: 0, chime: 0 },
      press: (action) => {
        const s = get();
        set({
          chrono: nextMode(s.chrono, action),
          pushes: { ...s.pushes, [action]: s.pushes[action] + 1 },
        });
      },
      setTurning: (turning) => set({ turning }),
      setMode: (mode) => set(mode === 'free' ? enterFree(null) : mode === 'tour' ? { mode } : { mode, ...PUSH_IN }),
      toggleSide: () => set({ freeSide: get().freeSide === 'back' ? 'dial' : 'back' }),
      goStep: (i) => {
        const stepIndex = clamp(Math.round(i), 0, last);
        set(caliber.tour[stepIndex]!.ctl === 'crown' ? { stepIndex } : { stepIndex, ...PUSH_IN });
      },
      next: () => get().goStep(get().stepIndex + 1),
      prev: () => get().goStep(get().stepIndex - 1),
      pick: (focus) => {
        if (get().mode === 'tour') {
          const chapter = caliber.tour[get().stepIndex]!.chapter;
          const here = caliber.tour.findIndex((s) => s.focus === focus && s.chapter === chapter);
          const i = here >= 0 ? here : caliber.tour.findIndex((s) => s.focus === focus);
          if (i >= 0) return get().goStep(i);
          return set(enterFree(focus));
        }
        if (get().mode === 'free') set({ selected: focus });
      },
      setExplode: (v) => set({ explode: clamp(v, 0, 1) }),
      setFreeSpeedExp: (v) => set({ freeSpeedExp: clamp(v, -2, 1) }),
      togglePaused: () => set({ paused: !get().paused }),
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
    };
  });
}
