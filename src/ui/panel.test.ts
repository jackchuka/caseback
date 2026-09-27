import { describe, expect, it } from 'vitest';
import { panelModel } from './panel';
import { miniCaliber } from '../test/fixtures';

const c = miniCaliber();

describe('panelModel', () => {
  it('describes the overview step with its own title', () => {
    const m = panelModel(c, 'tour', 0, null)!;
    expect(m.titleKey).toBe('mini:steps.time-overview.title');
    expect(m.subtitleKey).toBeNull();
    expect(m.bodyKey).toBe('mini:steps.time-overview.body');
  });
  it('uses the part name for a focused step and flags estimated values', () => {
    const m = panelModel(c, 'tour', 1, null)!;
    expect(m.titleKey).toBe('mini:parts.a.name');
    expect(m.kickerKey).toBe('mini:steps.time-a.kicker');
    expect(m.stats).toEqual([{ label: 'teeth', value: '120' }]);
    expect(m.estimated).toBe(true);
    expect(m.speed).toBeNull();
  });
  it('shows the selected part in free mode and nothing without a selection', () => {
    expect(panelModel(c, 'free', 0, 'fork')!.titleKey).toBe('mini:parts.fork.name');
    expect(panelModel(c, 'free', 0, null)).toBeNull();
    expect(panelModel(c, 'intro', 0, null)).toBeNull();
  });
  it('reports fast-forward speeds only', () => {
    const fast = miniCaliber();
    fast.tour[1]!.speed = 60;
    expect(panelModel(fast, 'tour', 1, null)!.speed).toBe(60);
  });
});
