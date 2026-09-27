import { describe, expect, it } from 'vitest';
import { CaliberSchema } from './schema';
import { focusKey, toothCount, validateCaliber } from './validate';
import { miniCaliber } from '../test/fixtures';

describe('CaliberSchema', () => {
  it('accepts the fixture', () => {
    expect(() => CaliberSchema.parse(miniCaliber())).not.toThrow();
  });
  it('rejects a wheel with zero teeth', () => {
    const c = miniCaliber();
    c.parts[0]!.shape = { kind: 'wheel', teeth: 0, module: 0.1, thickness: 0.2, spokes: 0 };
    expect(() => CaliberSchema.parse(c)).toThrow();
  });
});

describe('focusKey / toothCount', () => {
  it('uses the arbor when present', () => {
    const c = miniCaliber();
    expect(focusKey(c.parts[0]!)).toBe('a');
    expect(focusKey(c.parts[3]!)).toBe('fork');
  });
  it('reads teeth and leaves', () => {
    const c = miniCaliber();
    expect(toothCount(c.parts[0]!.shape)).toBe(120);
    expect(toothCount(c.parts[1]!.shape)).toBe(10);
    expect(toothCount(c.parts[4]!.shape)).toBeNull();
  });
});

describe('validateCaliber', () => {
  it('returns no errors for the fixture', () => {
    expect(validateCaliber(miniCaliber())).toEqual([]);
  });
  it('reports duplicate ids, dangling references and unknown sources', () => {
    const c = miniCaliber();
    c.parts.push({ ...c.parts[0]! });
    c.couplings.push({ type: 'mesh', a: 'w1', b: 'nope' });
    c.couplings.push({ type: 'mesh', a: 'w1', b: 'bal' });
    c.tour.push({ ...c.tour[0]!, id: 'x', chapter: 'missing', focus: 'ghost' });
    c.chapters[0]!.flow.push('ghost');
    c.parts[1]!.provenance = { confidence: 'sourced', sourceIds: ['s9'] };
    const errors = validateCaliber(c);
    expect(errors).toContain('duplicate part id: w1');
    expect(errors).toContain('mesh: unknown part nope');
    expect(errors).toContain('mesh: bal has no teeth');
    expect(errors).toContain('tour x: unknown chapter missing');
    expect(errors).toContain('tour x: unknown focus ghost');
    expect(errors).toContain('chapter time: unknown flow node ghost');
    expect(errors).toContain('part p2: unknown source s9');
  });
  it('requires exactly one escapement', () => {
    const c = miniCaliber();
    c.couplings = c.couplings.filter((x) => x.type !== 'escapement');
    expect(validateCaliber(c)).toContain('exactly one escapement coupling required');
  });
});
