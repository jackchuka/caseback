import { describe, expect, it } from 'vitest';
import { calibers } from '../../../calibers';
import { movementFrame } from '../../../../src/scene/exterior/frame';
import { caseFront, caseShape } from './case';
import { crownX, sinnCrown } from './crown';
import { S } from './params';

const m = movementFrame(calibers['eta-2824-2']!);

describe('Sinn 556 crown', () => {
  const [body, tube] = sinnCrown().map((l) => { l.geometry.computeBoundingBox(); return l.geometry.boundingBox!; });
  it('ends where the front photo shows it, 24.06 mm from the centre', () => {
    expect(crownX() - body!.min.y).toBeCloseTo(24.05, 1);
    expect(body!.max.x).toBeCloseTo(S.crownDiameter / 2, 1);
  });
  it('sits between the guards, its tube reaching into the case', () => {
    expect(S.crownDiameter / 2).toBeLessThan(S.guard.notch);
    expect(crownX() - tube!.max.y).toBeLessThan(S.caseRadius);
    expect(crownX() - S.crownLength / 2).toBeGreaterThan(S.caseRadius);
  });
  it('stays within the flank\'s height on the stem axis', () => {
    expect(m.stemZ - S.crownDiameter / 2).toBeGreaterThan(caseFront(m) - 0.3);
    expect(m.stemZ + S.crownDiameter / 2).toBeLessThan(caseShape(m).back);
  });
});
