import { describe, expect, it } from 'vitest';
import { buildSolver, pawlAdvance, pawlStroke } from './solver';
import { miniCaliber } from '../test/fixtures';
import { validateCaliber } from '../model/validate';
import { CaliberSchema, type Caliber } from '../model/schema';

const TAU = Math.PI * 2;
const est = { confidence: 'estimated' as const, sourceIds: [] };
const base = { side: 'back' as const, explode: { dz: 0 }, material: 'gilt' as const, provenance: est, mechanism: 'automatic' as const };

// Rotor gear (40) → first reduction wheel (40) carrying an eccentric; the lever runs +X to a 30-tooth wheel whose
// 10-leaf pinion winds a 50-tooth ratchet.
function pawlCaliber(): Caliber {
  const c = miniCaliber();
  c.parts.push(
    { ...base, id: 'rotor', arbor: 'rotor', pos: { x: 0, y: 0, z: 4.4 }, shape: { kind: 'rotor', radius: 12, hub: 1.2, thickness: 0.4 } },
    { ...base, id: 'rotor-gear', arbor: 'rotor', pos: { x: 0, y: 0, z: 4 }, shape: { kind: 'wheel', teeth: 40, module: 0.1, thickness: 0.16, spokes: 0 } },
    { ...base, id: 'first', arbor: 'first', pos: { x: 0, y: 4, z: 4 }, shape: { kind: 'wheel', teeth: 40, module: 0.1, thickness: 0.16, spokes: 0 } },
    { ...base, id: 'ecc', arbor: 'first', pos: { x: 0, y: 4, z: 4.2 }, shape: { kind: 'eccentric', radius: 0.4, throw: 0.3, thickness: 0.15 } },
    { ...base, id: 'lever', pos: { x: 0.3, y: 4, z: 4.2 }, shape: { kind: 'pawl-lever', length: 8, reach: 1.5, hole: 0.42, width: 0.4, thickness: 0.12 } },
    { ...base, id: 'second', arbor: 'second', pos: { x: 8.3, y: 4, z: 4.2 }, shape: { kind: 'wheel', teeth: 30, module: 0.1, thickness: 0.12, spokes: 0 } },
    { ...base, id: 'second-pinion', arbor: 'second', pos: { x: 8.3, y: 4, z: 3.9 }, shape: { kind: 'pinion', leaves: 10, module: 0.1, length: 0.3 } },
    { ...base, id: 'ratchet', mechanism: 'power', pos: { x: 8.3, y: 7, z: 3.9 }, shape: { kind: 'ratchet', teeth: 50, module: 0.1, thickness: 0.2 } },
  );
  c.couplings.push(
    { type: 'mesh', a: 'rotor-gear', b: 'first' },
    { type: 'pawl', eccentric: 'ecc', lever: 'lever', wheel: 'second' },
    { type: 'mesh', a: 'second-pinion', b: 'ratchet' },
  );
  return c;
}

describe('pawl (Magic Lever) coupling', () => {
  const c = pawlCaliber();
  const solve = buildSolver(c);
  const pawl = solve.info.pawl!;

  it('validates and reads the lever geometry', () => {
    expect(() => CaliberSchema.parse(c)).not.toThrow();
    expect(validateCaliber(c)).toEqual([]);
    expect(pawl).toMatchObject({ inputKey: 'first', outputKey: 'second', throw: 0.3, rest: 0, axis: 0, radius: 1.5 });
    expect(solve.info.oneWay).toBeNull();
    expect(solve.info.winder?.inputKey).toBe('first');
  });
  it('turns the first reduction wheel from the rotor', () => {
    expect(solve({ t: 0, explode: 0, rotor: 1 }).get('ecc')!.angle).toBeCloseTo(-1);
  });
  it('strokes the lever by twice the throw per half turn of the eccentric', () => {
    expect(pawlStroke(pawl, 0) - pawlStroke(pawl, Math.PI)).toBeCloseTo(0.6);
  });
  it('advances the wheel the same way whichever way the eccentric turns', () => {
    const fwd = pawlAdvance(pawl, 0, Math.PI);
    const back = pawlAdvance(pawl, 0, -Math.PI);
    expect(fwd).toBeCloseTo(0.6 / 1.5);
    expect(back).toBeCloseTo(fwd);
    expect(pawlAdvance(pawl, 1, 0.5)).toBeGreaterThan(0);
  });
  it('winds 4 × throw of arc at the claws per full turn of the eccentric', () => {
    let wound = 0;
    let prev = 0;
    for (let i = 1; i <= 360; i++) {
      const a = (i / 360) * TAU;
      wound += pawlAdvance(pawl, prev, a);
      prev = a;
    }
    expect(wound * pawl.radius).toBeCloseTo(4 * pawl.throw, 6);
  });
  it('drives the ratchet from the wound angle through the second reduction pinion', () => {
    expect(solve({ t: 0, explode: 0, wound: 1 }).get('second')!.angle).toBe(1);
    expect(solve.info.ratchetFactor).toBeCloseTo(-10 / 50);
    // The rotor alone never turns the second wheel: only the claws do.
    expect(solve({ t: 0, explode: 0, rotor: 3 }).get('second')!.angle).toBe(0);
  });
  it('slides the lever with the eccentric and keeps it aimed at the wheel', () => {
    const at = (rotor: number) => solve({ t: 0, explode: 0, rotor }).get('lever')!;
    expect(at(0)).toMatchObject({ dx: 0, dy: 0, angle: 0 });
    // A quarter turn back (the eccentric turns opposite the rotor) carries the pin to +Y.
    const q = at(-Math.PI / 2);
    expect(q.dx).toBeCloseTo(-0.3);
    expect(q.dy).toBeCloseTo(0.3);
    expect(q.angle).toBeCloseTo(Math.atan2(-0.3, 8.3));
  });
});

describe('pawl validation', () => {
  it('names the parts a pawl needs', () => {
    const c = pawlCaliber();
    c.couplings = c.couplings.map((cp) => (cp.type === 'pawl' ? { ...cp, eccentric: 'first', lever: 'ghost', wheel: 'ratchet' } : cp));
    const errors = validateCaliber(c);
    expect(errors).toContain('pawl: first is not a eccentric');
    expect(errors).toContain('pawl: unknown part ghost');
    expect(errors).toContain('pawl: ratchet is not a wheel');
  });
  it('checks the lever sits on the eccentric\'s pin, reaches the wheel and meets its pitch circle', () => {
    const c = pawlCaliber();
    const lever = c.parts.find((p) => p.id === 'lever')!;
    lever.pos = { ...lever.pos, x: 0.5 };
    if (lever.shape.kind === 'pawl-lever') lever.shape = { ...lever.shape, reach: 1.6 };
    const errors = validateCaliber(c);
    expect(errors).toContain("pawl: lever does not sit on ecc's pin at rest");
    expect(errors).toContain("pawl: lever does not reach second's centre");
    expect(errors).toContain("pawl: lever's claws are not on second's pitch circle");
  });
  it('allows only one winding rectifier', () => {
    const c = pawlCaliber();
    c.couplings.push({ type: 'one-way', input: 'first', output: 'second' });
    expect(validateCaliber(c)).toContain('at most one winding rectifier (one-way, pawl or click) allowed');
  });
});
