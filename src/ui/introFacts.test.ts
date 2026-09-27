import { describe, expect, it } from 'vitest';
import { introFacts } from './introFacts';
import { getCaliber } from '../../data/calibers';
import { getWatch } from '../../data/watches';

const c = getCaliber('eta-2824-2')!;

describe('introFacts', () => {
  it('uses the caliber when there is no watch or the watch uses it as-is', () => {
    expect(introFacts(c)).toEqual({ name: 'ETA 2824-2', beats: 8, diameter: 25.6, base: null });
    expect(introFacts(c, getWatch('sinn/556'))).toMatchObject({ beats: 8, base: null });
  });
  it('uses the derivative movement for the Hamilton H-10 and names the base caliber', () => {
    expect(introFacts(c, getWatch('hamilton/khaki-field-auto-h70455553'))).toEqual({ name: 'Hamilton H-10', beats: 6, diameter: 25.6, base: 'ETA 2824-2' });
  });
});
