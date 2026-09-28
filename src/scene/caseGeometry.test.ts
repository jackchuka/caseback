import { describe, expect, it } from 'vitest';
import { casingRing, stemExtension } from './caseGeometry';

describe('case fit', () => {
  it('has no casing ring when the case hugs the movement', () => {
    expect(casingRing(12.8, 13.15)).toBeNull();
  });
  it('extends the stem to the crown', () => {
    const e = stemExtension(16.1, 22.3, 4);
    expect(e.from).toBe(16.1);
    expect(e.to).toBeCloseTo(20.3);
    expect(stemExtension(16.1, 17.1, 2).to).toBeGreaterThanOrEqual(16.1);
  });
});

import { casingSpan } from './caseGeometry';
describe('casing ring span', () => {
  it('runs from the plate dial face to the rotor back', () => {
    expect(casingSpan({ plateFrontZ: -1.15, rotorBackZ: 3.4 })).toEqual({ from: -1.15, to: 3.4 });
  });
});
