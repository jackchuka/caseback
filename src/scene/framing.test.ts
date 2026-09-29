import { describe, expect, it } from 'vitest';
import { calibers } from '../../data/calibers';
import { watches } from '../../data/watches';
import { buildExterior } from './exterior/contract';
import { caseBounds } from './exterior/caseBounds';
import { movementFrame } from './exterior/frame';
import { genericCase } from './exterior/generic';
import { frameFor, IDENTITY, insetsOf, NO_INSETS, viewOffset } from './framing';

describe('insetsOf', () => {
  it('reads a left column as a left inset and a right card as a right inset', () => {
    expect(insetsOf([{ left: 77, top: 200, right: 537, bottom: 500 }], 1100, 700)).toEqual({ ...NO_INSETS, left: 537 });
    expect(insetsOf([{ left: 1118, top: 150, right: 1418, bottom: 750 }], 1440, 900)).toEqual({ ...NO_INSETS, right: 322 });
  });
  it('reads a full-width sheet as a bottom inset and keeps the deepest of each side', () => {
    const sheet = { left: 0, top: 600, right: 390, bottom: 844 };
    const bar = { left: 12, top: 740, right: 378, bottom: 832 };
    expect(insetsOf([sheet, bar], 390, 844)).toEqual({ ...NO_INSETS, bottom: 244 });
  });
  it('ignores empty and off-screen boxes', () => {
    expect(insetsOf([{ left: 0, top: 0, right: 0, bottom: 0 }, { left: 2000, top: 0, right: 2100, bottom: 50 }], 1440, 900)).toEqual(NO_INSETS);
  });
});

describe('frameFor', () => {
  it('leaves the subject alone without panels', () => {
    expect(frameFor(1440, 900, NO_INSETS, null)).toEqual(IDENTITY);
  });
  it('centres the subject in the free area', () => {
    expect(frameFor(1100, 700, { ...NO_INSETS, left: 540 }, null)).toEqual({ dx: 270, dy: 0, scale: 1 });
    expect(frameFor(390, 844, { ...NO_INSETS, bottom: 244 }, null)).toEqual({ dx: 0, dy: -122, scale: 1 });
  });
  it('shrinks a subject that does not fit, but never below a floor', () => {
    const f = frameFor(1100, 700, { ...NO_INSETS, left: 540 }, { x: 400, y: 300 });
    expect(f.scale).toBeCloseTo((280 - 16) / 400);
    expect(frameFor(390, 844, { ...NO_INSETS, bottom: 400 }, { x: 2000, y: 2000 }).scale).toBe(0.25);
    expect(frameFor(1440, 900, NO_INSETS, { x: 200, y: 200 }).scale).toBe(1);
  });
});

describe('viewOffset', () => {
  it('is the plain view at identity and moves the window against the shift', () => {
    expect(viewOffset(1000, 600, IDENTITY)).toEqual([1000, 600, 0, 0, 1000, 600]);
    expect(viewOffset(1000, 600, { dx: 100, dy: -50, scale: 1 })).toEqual([1000, 600, -100, 50, 1000, 600]);
    // At half scale the full view is half the canvas, so the canvas window starts a quarter canvas before it.
    expect(viewOffset(1000, 600, { dx: 0, dy: 0, scale: 0.5 })).toEqual([500, 300, -250, -150, 1000, 600]);
  });
});

describe('caseBounds', () => {
  it('is the generic ring\'s outer radius on a caliber page', () => {
    const frame = movementFrame(calibers['eta-2824-2']!);
    const b = buildExterior(genericCase, { movement: frame, quality: 'low' });
    expect(caseBounds(b, 0).radius).toBeCloseTo(frame.diameterMm / 2 + 3.5, 1);
  });
  for (const w of Object.values(watches)) {
    it(`is a wristwatch-sized case for ${w.id}`, () => {
      const b = buildExterior(w.exterior, { movement: movementFrame(calibers[w.caliberId]!), quality: 'low' });
      const { radius, front, back } = caseBounds(b, 0);
      expect(radius).toBeGreaterThan(17);
      expect(radius).toBeLessThan(27);
      expect(back - front).toBeGreaterThan(5);
    }, 20_000);
  }
});
