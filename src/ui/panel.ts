import type { Caliber, Stat } from '../model/schema';
import { focusKey } from '../model/validate';
import type { Mode } from '../state/store';

export type PanelModel = {
  kickerKey: string | null;
  titleKey: string;
  subtitleKey: string | null;
  bodyKey: string;
  stats: Stat[];
  speed: number | null;
  estimated: boolean;
};

const isEstimated = (c: Caliber, key: string | null) =>
  key !== null && c.parts.some((p) => focusKey(p) === key && p.provenance.confidence === 'estimated');

export function panelModel(c: Caliber, mode: Mode, stepIndex: number, selected: string | null): PanelModel | null {
  const ns = c.id;
  if (mode === 'tour') {
    const s = c.tour[stepIndex]!;
    return {
      kickerKey: `${ns}:steps.${s.id}.kicker`,
      titleKey: s.focus ? `${ns}:parts.${s.focus}.name` : `${ns}:steps.${s.id}.title`,
      subtitleKey: s.focus ? `${ns}:parts.${s.focus}.en` : null,
      bodyKey: `${ns}:steps.${s.id}.body`,
      stats: s.stats,
      speed: s.speed > 1 ? s.speed : null,
      estimated: isEstimated(c, s.focus),
    };
  }
  if (mode === 'free' && selected) {
    return {
      kickerKey: null,
      titleKey: `${ns}:parts.${selected}.name`,
      subtitleKey: `${ns}:parts.${selected}.en`,
      bodyKey: `${ns}:parts.${selected}.body`,
      stats: [],
      speed: null,
      estimated: isEstimated(c, selected),
    };
  }
  return null;
}
