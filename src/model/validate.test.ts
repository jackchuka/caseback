import { describe, expect, it } from 'vitest';
import { CaliberSchema, type Caliber, type Part } from './schema';
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

const strikeCaliber = (): Caliber => {
  const c = miniCaliber();
  const est = { confidence: 'estimated' as const, sourceIds: [] };
  const lever = (id: string): Part => ({ id, mechanism: 'strike', side: 'dial', pos: { x: 3, y: 3, z: -2 }, explode: { dz: -1 }, material: 'steel', shape: { kind: 'lever', outline: [{ x: 0, y: -0.3 }, { x: 2, y: 0 }, { x: 0, y: 0.3 }], thickness: 0.2, hole: 0.1 }, provenance: est });
  return {
    ...c,
    parts: [
      ...c.parts,
      { id: 'snail', arbor: 'a', mechanism: 'strike', side: 'dial', pos: { x: 0, y: 0, z: -2 }, explode: { dz: -1 }, material: 'steel', shape: { kind: 'snail', rMin: 1, rMax: 2, thickness: 0.3 }, provenance: est },
      lever('lever'), lever('hammer'), lever('switch'), lever('indicator'),
      { id: 'column', mechanism: 'strike', side: 'dial', pos: { x: 5, y: 0, z: -2 }, explode: { dz: -1 }, material: 'steel', shape: { kind: 'cam', teeth: 8, radius: 1.5, thickness: 0.3 }, provenance: est },
    ],
    couplings: [...c.couplings, { type: 'strike', snail: 'snail', lever: 'lever', hammer: 'hammer', lift: 0.35, swing: 0.14, cock: 0.084, silence: { wheel: 'column', switch: 'switch', indicator: 'indicator', turn: 0.6, retreat: 0.3 } }],
    exterior: { ...c.exterior, pushers: [{ action: 'chime', hour: 4, z: -2 }] },
  };
};

describe('strike coupling', () => {
  it('accepts a strike with its chime pusher', () => {
    expect(validateCaliber(strikeCaliber())).toEqual([]);
  });
  it('rejects a snail without an arbor', () => {
    const c = strikeCaliber();
    const parts = c.parts.map((p) => {
      if (p.id !== 'snail') return p;
      const { arbor: _arbor, ...rest } = p;
      return rest;
    });
    expect(validateCaliber({ ...c, parts })).toContain('strike: snail snail has no arbor');
  });
  it('takes a signed swing, the blow\'s direction, but never a zero one', () => {
    const withSwing = (swing: number) => {
      const c = strikeCaliber();
      return { ...c, couplings: c.couplings.map((cp) => (cp.type === 'strike' ? { ...cp, swing } : cp)) };
    };
    expect(() => CaliberSchema.parse(withSwing(-0.14))).not.toThrow();
    expect(() => CaliberSchema.parse(withSwing(0))).toThrow();
  });
  it('takes a signed lift, the lever\'s direction as the snail raises it, but never a zero one', () => {
    const withLift = (lift: number) => {
      const c = strikeCaliber();
      return { ...c, couplings: c.couplings.map((cp) => (cp.type === 'strike' ? { ...cp, lift } : cp)) };
    };
    expect(() => CaliberSchema.parse(withLift(-0.2))).not.toThrow();
    expect(() => CaliberSchema.parse(withLift(0))).toThrow();
  });
  it('needs a snail and a cam of the right kinds', () => {
    const c = strikeCaliber();
    const bad = { ...c, parts: c.parts.map((p) => (p.id === 'snail' ? { ...p, shape: { kind: 'heart' as const, radius: 1, thickness: 0.3 } } : p)) };
    expect(validateCaliber(bad)).toContain('strike: snail is not a snail');
  });
  it('refuses a chime pusher or chime controls without a strike', () => {
    const c = miniCaliber();
    expect(validateCaliber({ ...c, exterior: { ...c.exterior, pushers: [{ action: 'chime', hour: 4, z: -2 }] } })).toContain('a chime pusher needs a strike coupling');
    expect(validateCaliber({ ...c, tour: c.tour.map((s) => ({ ...s, ctl: 'chime' as const })) })).toContain('chime controls need a strike coupling');
  });
  it('still refuses chronograph pushers without a chronograph', () => {
    const c = miniCaliber();
    expect(validateCaliber({ ...c, exterior: { ...c.exterior, pushers: [{ action: 'reset', hour: 4, z: -2 }] } })).toContain('chronograph pushers need a chronograph coupling');
  });
});
