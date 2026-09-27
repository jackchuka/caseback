import { describe, expect, it } from 'vitest';
import { createAppStore } from './store';
import { miniCaliber } from '../test/fixtures';

const make = () => createAppStore(miniCaliber());

describe('app store', () => {
  it('starts in the intro at step 0', () => {
    const s = make().getState();
    expect(s.mode).toBe('intro');
    expect(s.stepIndex).toBe(0);
  });
  it('clamps step navigation', () => {
    const store = make();
    store.getState().goStep(99);
    expect(store.getState().stepIndex).toBe(2);
    store.getState().next();
    expect(store.getState().stepIndex).toBe(2);
    store.getState().goStep(-5);
    expect(store.getState().stepIndex).toBe(0);
    store.getState().prev();
    expect(store.getState().stepIndex).toBe(0);
  });
  it('finishOpening enters the tour and keeps a deep-linked step', () => {
    const store = createAppStore(miniCaliber(), { mode: 'opening', stepIndex: 2 });
    store.getState().finishOpening();
    expect(store.getState().mode).toBe('tour');
    expect(store.getState().stepIndex).toBe(2);
  });
  it('picking a part with a tour step jumps to that step', () => {
    const store = make();
    store.getState().setMode('tour');
    store.getState().pick('esc');
    expect(store.getState().stepIndex).toBe(2);
    expect(store.getState().mode).toBe('tour');
  });
  it('picking a part without a step switches to free mode and selects it', () => {
    const store = make();
    store.getState().setMode('tour');
    store.getState().pick('plate');
    expect(store.getState().mode).toBe('free');
    expect(store.getState().selected).toBe('plate');
  });
  it('entering free mode clears the selection and returning keeps the step', () => {
    const store = make();
    store.getState().setMode('tour');
    store.getState().goStep(1);
    store.getState().setMode('free');
    expect(store.getState().selected).toBeNull();
    store.getState().pick('fork');
    store.getState().setMode('tour');
    expect(store.getState().stepIndex).toBe(1);
  });
  it('clamps explode and free speed', () => {
    const store = make();
    store.getState().setExplode(3);
    store.getState().setFreeSpeedExp(9);
    expect(store.getState().explode).toBe(1);
    expect(store.getState().freeSpeedExp).toBe(1);
  });
  it('free side starts from the current step side and toggles', () => {
    const store = make();
    store.getState().setMode('tour');
    store.getState().setMode('free');
    expect(store.getState().freeSide).toBe('back');
    store.getState().toggleSide();
    expect(store.getState().freeSide).toBe('dial');
  });
  it('picking a part without a step keeps the side of the current step', () => {
    const c = miniCaliber();
    c.tour[1]!.side = 'dial';
    const store = createAppStore(c, { mode: 'tour', stepIndex: 1 });
    store.getState().pick('plate');
    expect(store.getState()).toMatchObject({ mode: 'free', selected: 'plate', freeSide: 'dial' });
  });
  it('stores the power reserve', () => {
    const store = make();
    expect(store.getState().reserveH).toBeCloseTo(0.45 * miniCaliber().specs.powerReserveH);
    store.getState().setReserve(12.5);
    expect(store.getState().reserveH).toBe(12.5);
  });
});
