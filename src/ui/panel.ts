import type { Caliber, Stat } from '../model/schema';

type Source = Caliber['sources'][number];
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
  sources: Source[];
  notes: string[];
};

const isEstimated = (c: Caliber, key: string | null) =>
  key !== null && c.parts.some((p) => focusKey(p) === key && p.provenance.confidence === 'estimated');

function provenanceOf(c: Caliber, key: string | null): { sources: Source[]; notes: string[] } {
  const group = key === null ? [] : c.parts.filter((p) => focusKey(p) === key);
  const ids = new Set(group.flatMap((p) => p.provenance.sourceIds));
  const notes = [...new Set(group.flatMap((p) => (p.provenance.note ? [p.provenance.note] : [])))];
  return { sources: c.sources.filter((s) => ids.has(s.id)), notes };
}

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
      ...provenanceOf(c, s.focus),
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
      ...provenanceOf(c, selected),
    };
  }
  return null;
}
