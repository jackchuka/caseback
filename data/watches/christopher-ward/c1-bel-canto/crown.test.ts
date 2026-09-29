import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { layersBox } from '../../../../src/test/geometry';
import { caseBack, caseFront } from './case';
import { CROWN_FLUTES, belCantoCrown, belCantoPushers, crownRadius, pusherRadius } from './crown';
import { P } from './params';

const m = movementFrame(calibers['cw-fs01']!);

describe('Bel Canto crown', () => {
  const layers = belCantoCrown();
  const body = layers.find((l) => l.material === 'polished')!.geometry;
  it('sits on the stem, 25.3° above 3 o\'clock, as on the front photo', () => {
    expect(m.stemAngle).toBeCloseTo((P.crown.angle * Math.PI) / 180, 9);
  });
  it('stands off the case flank by its neck and ends 23.3 mm out, as on the front photo', () => {
    expect(crownRadius()).toBeCloseTo(P.caseRadius + P.crown.neck + P.crown.length / 2, 9);
    expect(crownRadius() + P.crown.length / 2).toBeCloseTo(23.3, 1);
  });
  it('turns a crown of block flutes at the measured diameter', () => {
    body.computeBoundingBox();
    const b = body.boundingBox!;
    expect(b.max.y - b.min.y).toBeCloseTo(P.crown.length, 1);
    const p = body.getAttribute('position');
    const grip: number[] = [];
    for (let i = 0; i < p.count; i++) if (p.getY(i) > b.min.y + 0.7 && p.getY(i) < b.max.y - 0.4) grip.push(Math.hypot(p.getX(i), p.getZ(i)));
    expect(Math.max(...grip)).toBeCloseTo(P.crown.diameter / 2, 1);
    expect(Math.min(...grip.filter((r) => r > P.crown.diameter / 4))).toBeLessThan(P.crown.diameter / 2 - 0.25);
    expect(CROWN_FLUTES).toBe(P.crown.flutes);
  });
  it('runs a tube from the neck into the case', () => {
    const tube = layers.find((l) => l !== layers[0])!;
    const b = layersBox([tube]);
    expect(b.max.y).toBeGreaterThan(P.crown.length / 2 + P.crown.neck);
  });
  it('sits within the case band\'s height', () => {
    expect(m.stemZ - P.crown.diameter / 2).toBeGreaterThan(caseFront(m));
    expect(m.stemZ + P.crown.diameter / 2).toBeLessThan(caseBack(m));
  });
});

describe('Bel Canto chime pusher', () => {
  const pushers = belCantoPushers();
  const ps = pushers[0]!;
  const box = layersBox(ps.layers);
  it('sits 25° below 3 o\'clock, nearly mirroring the crown, as on the front photo', () => {
    expect(m.pushers[0]!.angle).toBeCloseTo((25 * Math.PI) / 180, 9);
  });
  it('is one pusher, for the chime, pressed in by its travel', () => {
    expect(pushers).toHaveLength(1);
    expect(ps.action).toBe('chime');
    expect(ps.travel).toBe(P.pusher.travel);
    expect(ps.radius).toBe(pusherRadius());
  });
  it('is a block 6.9 mm across, ending 22.35 mm out and seated in the case band', () => {
    // Local +Y runs toward the case, X across the flank, Z through the watch.
    expect(box.max.x - box.min.x).toBeCloseTo(P.pusher.width, 5);
    expect(box.max.z - box.min.z).toBeCloseTo(P.pusher.height, 5);
    expect(ps.radius - box.min.y).toBeCloseTo(P.pusher.end, 5);
    expect(ps.radius - box.max.y).toBeCloseTo(P.pusher.inner, 5);
  });
  it('ends in a polished tip faceted down to a narrower end face', () => {
    const tip = ps.layers.find((l) => l.material === 'polished')!;
    const p = tip.geometry.getAttribute('position');
    let endX = 0, endZ = 0;
    for (let i = 0; i < p.count; i++) if (Math.abs(p.getY(i) - box.min.y) < 1e-5) { endX = Math.max(endX, Math.abs(p.getX(i))); endZ = Math.max(endZ, Math.abs(p.getZ(i))); }
    expect(2 * endX).toBeCloseTo(P.pusher.endWidth, 5);
    expect(2 * endZ).toBeCloseTo(P.pusher.endHeight, 5);
    expect(ps.radius - layersBox([tip]).max.y).toBeCloseTo(P.pusher.tipFrom, 5);
  });
  it('sits within the case band\'s height', () => {
    const z = m.pushers[0]!.z;
    expect(z - P.pusher.height / 2).toBeGreaterThan(caseFront(m));
    expect(z + P.pusher.height / 2).toBeLessThan(caseBack(m));
  });
});
