import type { TourStep } from '../model/schema';
import type { Mode } from '../state/store';

export function chapterSteps(tour: TourStep[], chapterId: string): number[] {
  return tour.flatMap((s, i) => (s.chapter === chapterId ? [i] : []));
}

export function localIndex(tour: TourStep[], index: number): number {
  const first = tour.findIndex((s) => s.chapter === tour[index]?.chapter);
  return index - first;
}

export function flowStates(nodeCount: number, local: number): number[] {
  return Array.from({ length: Math.max(0, nodeCount - 1) }, (_, k) => {
    if (local === 0) return 1;
    if (k < local - 1) return 0.35;
    return k === local - 1 ? 1 : 0;
  });
}

export function effectiveSpeed(mode: Mode, step: TourStep, freeSpeedExp: number, paused: boolean): number {
  if (paused) return 0;
  return mode === 'free' ? 10 ** freeSpeedExp : step.speed;
}
