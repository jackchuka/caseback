import { describe, expect, it } from 'vitest';
import { chapterSteps, effectiveSpeed, flowStates, localIndex } from './engine';
import { advance } from '../scene/simClock';
import { miniCaliber } from '../test/fixtures';

const tour = miniCaliber().tour;

describe('tour engine', () => {
  it('lists the steps of a chapter', () => {
    expect(chapterSteps(tour, 'time')).toEqual([0, 1, 2]);
    expect(chapterSteps(tour, 'nope')).toEqual([]);
  });
  it('computes the index inside the chapter', () => {
    expect(localIndex(tour, 2)).toBe(2);
  });
  it('lights every segment on the overview and trails behind later steps', () => {
    expect(flowStates(4, 0)).toEqual([1, 1, 1]);
    expect(flowStates(4, 1)).toEqual([1, 0, 0]);
    expect(flowStates(4, 3)).toEqual([0.35, 0.35, 1]);
  });
  it('uses the step speed in the tour and the slider in free mode', () => {
    const step = tour[1]!;
    expect(effectiveSpeed('tour', step, 0, false)).toBe(0.1);
    expect(effectiveSpeed('free', step, 1, false)).toBe(10);
    expect(effectiveSpeed('free', step, 1, true)).toBe(0);
    expect(effectiveSpeed('intro', step, 0, false)).toBe(0.1);
  });
});

describe('advance', () => {
  it('clamps long frames so a background tab does not jump', () => {
    expect(advance(10, 5, 1)).toBeCloseTo(10.05);
    expect(advance(10, 0.01, 2)).toBeCloseTo(10.02);
  });
});
