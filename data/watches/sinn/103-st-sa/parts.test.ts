import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import type { ExteriorLayer, HandLayer } from '../../../../src/scene/exterior/contract';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { layersBox, radii } from '../../../../src/test/geometry';
import { bezelMarks, sinnBezel, sinnCrystal } from './bezel';
import { bezelTop, caseFront, crystalTop } from './case';
import { crownRadius, pusherRadius, sinnCrown, sinnPushers } from './crown';
import { openings, sinnDial } from './dial';
import { sinnHands } from './hands';
import { P } from './params';
import { sinnStrap } from './strap';

const m = movementFrame(calibers['valjoux-7750']!);
const maxRadius = (ls: Array<ExteriorLayer | HandLayer>) => Math.max(...ls.flatMap((l) => radii(l.geometry)));

describe('Sinn 103 bezel and crystal', () => {
  it('prints a countdown scale: a triangle at 12, the fives counter-clockwise from 5 at 11 o\'clock, a tick at every other minute', () => {
    const marks = bezelMarks();
    expect(marks.find((k) => k.minute === 0)!.kind).toBe('triangle');
    const numerals = marks.filter((k) => k.kind === 'numeral');
    expect(numerals).toHaveLength(11);
    expect(numerals.find((k) => k.minute === 55)!.text).toBe('5');
    expect(numerals.find((k) => k.minute === 5)!.text).toBe('55');
    expect(numerals.filter((k) => k.upright).map((k) => k.text)).toEqual(['35', '30', '25']);
    expect(marks.filter((k) => k.kind === 'tick')).toHaveLength(48);
  });
  it('is 41 mm across its coin edge and stands the measured height on the case', () => {
    const b = sinnBezel(m);
    expect(maxRadius([b[0]!])).toBeCloseTo(P.bezelOuter, 1);
    const z = layersBox([b[0]!]);
    expect(z.min.z).toBeCloseTo(bezelTop(m), 1);
    expect(z.max.z).toBeCloseTo(caseFront(m), 1);
  });
  it('domes the sapphire up to its apex', () => {
    const c = layersBox(sinnCrystal(m));
    expect(c.min.z).toBeCloseTo(crystalTop(m), 2);
    expect(bezelTop(m) - c.min.z).toBeGreaterThan(2);
  });
});

describe('Sinn 103 dial', () => {
  const dial = sinnDial(m);
  it('cuts its day and date openings over the movement\'s own windows', () => {
    const [day, date] = openings();
    expect(m.dayWindow!.x).toBeGreaterThan(day!.x0);
    expect(m.dayWindow!.x).toBeLessThan(day!.x1);
    expect(m.dateWindow!.x).toBeGreaterThan(date!.x0);
    expect(m.dateWindow!.x).toBeLessThan(date!.x1);
    expect(dial.find((l) => l.name === 'date-frame')).toBeDefined();
  });
  it('prints its sub-dials on the movement\'s own sub-dial arbors', () => {
    for (const s of P.subdials) expect(m.extraHands.find((h) => h.id === s.id), s.id).toMatchObject({ x: s.x, y: s.y });
  });
  it('stands twelve lume markers on the dial', () => {
    const lume = dial.filter((l) => l.material === 'dial-lume');
    expect(lume).toHaveLength(12);
    expect(maxRadius(lume)).toBeCloseTo(Math.hypot(P.marker.radius + P.marker.length / 2, P.marker.width / 2), 1);
  });
});

describe('Sinn 103 hands', () => {
  const h = sinnHands();
  it('runs the hour and minute hands on to the numerals and the minute track', () => {
    expect(-layersBox(h.hour).min.y).toBeCloseTo(P.hands.hour.tip, 1);
    expect(-layersBox(h.minute).min.y).toBeCloseTo(P.hands.minute.tip, 1);
  });
  it('replaces the chronograph seconds and the three sub-dial hands, sized to their scales', () => {
    expect(Object.keys(h.extra).sort()).toEqual(m.extraHands.map((x) => x.id).sort());
    expect(-layersBox(h.extra['chrono-seconds-hand']).min.y).toBeCloseTo(P.hands.chrono.length, 1);
    for (const id of ['seconds-hand', 'minute-counter-hand', 'hour-counter-hand'] as const) expect(-layersBox(h.extra[id]).min.y).toBeLessThan(P.subdial.outer);
    expect(h.seconds).toEqual([]);
  });
});

describe('Sinn 103 crown and pushers', () => {
  it('ends the crown where the front photo does', () => {
    const b = layersBox(sinnCrown());
    expect(crownRadius() - b.min.y).toBeCloseTo(24.45, 1);
  });
  it('puts a pusher at each of the movement\'s pusher positions, ending where the front photo does', () => {
    const ps = sinnPushers();
    expect(ps.map((p) => p.action).sort()).toEqual(m.pushers.map((p) => p.action).sort());
    for (const p of ps) expect(pusherRadius() - layersBox(p.layers).min.y).toBeCloseTo(24.2, 1);
  });
});

describe('Sinn 103 strap', () => {
  it('leaves the lugs at 20 mm and runs on round the wrist', () => {
    const b = layersBox(sinnStrap(m).filter((l) => l.name === 'strap'));
    expect(b.max.x - b.min.x).toBeCloseTo(P.strap.startWidth, 0);
    expect(b.max.y).toBeGreaterThan(P.lugToLug / 2 + 5);
  });
});
