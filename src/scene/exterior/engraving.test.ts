import { describe, expect, it } from 'vitest';
import { calibers } from '../../../data/calibers';
import { watches } from '../../../data/watches';
import { casebackEngraving } from './engraving';

describe('caseback engraving', () => {
  it('engraves the caliber number without its maker', () => {
    expect(casebackEngraving(calibers['eta-2824-2']!)).toEqual({ number: '2824-2', jewels: 25 });
    expect(casebackEngraving(calibers['seiko-nh35a']!)).toEqual({ number: 'NH35A', jewels: 24 });
  });
  it('engraves the watch\'s own movement where it names one', () => {
    expect(casebackEngraving(calibers['seiko-nh35a']!, watches['seiko/presage-srpb43'])).toEqual({ number: '4R35', jewels: 23 });
    expect(casebackEngraving(calibers['eta-2824-2']!, watches['hamilton/khaki-field-auto-h70455553']).number).toBe('H-10');
  });
});
