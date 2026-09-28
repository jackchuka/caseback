import { describe, expect, it } from 'vitest';
import { WatchSchema, validateWatch, type WatchMeta } from './watch';

const w = (): WatchMeta => ({
  id: 'acme/diver', brand: 'Acme', model: 'Diver', reference: 'A1', caliberId: 'eta-2824-2',
  sources: [{ id: 's', title: 'S', url: 'https://example.com' }],
});

describe('watch schema', () => {
  it('accepts a valid watch', () => {
    expect(() => WatchSchema.parse(w())).not.toThrow();
  });
  it('rejects an id that is not brand/model', () => {
    expect(() => WatchSchema.parse({ ...w(), id: 'diver' })).toThrow();
  });
  it('reports unknown calibers', () => {
    expect(validateWatch({ ...w(), caliberId: 'nope' }, { 'eta-2824-2': {} })).toEqual(['acme/diver: unknown caliber nope']);
    expect(validateWatch(w(), { 'eta-2824-2': {} })).toEqual([]);
  });
});
