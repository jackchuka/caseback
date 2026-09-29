import { isDeepStrictEqual } from 'node:util';
import { describe, expect, it } from 'vitest';
import { calibers } from '../../../data/calibers';
import { watches } from '../../../data/watches';
import { movementFrame } from './frame';
import { packExterior, unpackExterior } from './transfer';

describe('exterior transfer', () => {
  for (const w of Object.values(watches)) {
    it(`${w.id} survives a structured clone`, () => {
      const ctx = { movement: movementFrame(calibers[w.caliberId]!), quality: 'low' as const };
      const { packed, transfer } = packExterior(w.exterior.geometry(ctx));
      const expected = structuredClone(packed);
      const back = unpackExterior(structuredClone(packed, { transfer }));
      // Compared as a boolean: a failing diff of a few hundred thousand vertices is unreadable anyway.
      expect(isDeepStrictEqual(packExterior(back).packed, expected)).toBe(true);
    }, 20_000);
  }
});
