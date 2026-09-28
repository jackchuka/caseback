import { describe, expect, it } from 'vitest';
import { exteriorVisibility } from './visibility';
describe('exteriorVisibility', () => {
  it('shows the finished watch in the intro', () => {
    expect(exteriorVisibility('intro', null, 0)).toEqual({ dial: true, crystal: true, strap: true });
  });
  it('removes the dial and crystal in dial-side chapters', () => {
    expect(exteriorVisibility('tour', 'dial', 0)).toMatchObject({ dial: false, crystal: false, strap: false });
    expect(exteriorVisibility('tour', 'back', 0)).toMatchObject({ dial: true, crystal: true });
  });
  it('removes the dial when exploding in free mode', () => {
    expect(exteriorVisibility('free', 'back', 0.5)).toMatchObject({ dial: false, crystal: false });
    expect(exteriorVisibility('free', 'dial', 0)).toMatchObject({ dial: true, crystal: true });
  });
});
