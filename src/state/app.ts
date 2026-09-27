import { useStore } from 'zustand';
import type { Caliber } from '../model/schema';
import { createAppStore, type AppState, type AppStore, type InitState } from './store';

let store: AppStore | null = null;

export function initAppStore(caliber: Caliber, init: Partial<InitState>): AppStore {
  store = createAppStore(caliber, init);
  return store;
}

export function appStore(): AppStore {
  if (!store) throw new Error('app store not initialised');
  return store;
}

export function useApp<T>(selector: (s: AppState) => T): T {
  return useStore(appStore(), selector);
}
