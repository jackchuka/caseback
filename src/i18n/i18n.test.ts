import { watches } from '../../data/watches';
import { describe, expect, it } from 'vitest';
import { createI18n } from './index';
import { getCaliber } from '../../data/calibers';
import { caliberVars } from './caliberVars';
import { focusKey } from '../model/validate';

const c = getCaliber('eta-2824-2')!;

describe('i18n', () => {
  it('interpolates caliber values into step text', async () => {
    const i18n = await createI18n('ja');
    const text = i18n.t('eta-2824-2:steps.time-third.body', caliberVars(c));
    expect(text).toContain('75');
    expect(text).toContain('10');
    expect(i18n.t('eta-2824-2:steps.time-balance.body', caliberVars(c))).toContain('8');
  });
  it('falls back to ja for keys missing in en', async () => {
    const i18n = await createI18n('en');
    i18n.addResource('ja', 'ui', 'onlyJa', 'ja-only');
    expect(i18n.t('ui:onlyJa')).toBe('ja-only');
  });
  it('has every tour and part string in both languages', async () => {
    for (const lang of ['ja', 'en'] as const) {
      const i18n = await createI18n(lang);
      const has = (key: string) => {
        const [ns, k] = key.split(':');
        return i18n.getResource(lang, ns!, k!) !== undefined;
      };
      for (const ch of c.chapters) expect(has(`eta-2824-2:chapters.${ch.id}.title`), `${lang} chapter ${ch.id}`).toBe(true);
      for (const s of c.tour) {
        expect(has(`eta-2824-2:steps.${s.id}.kicker`), `${lang} ${s.id} kicker`).toBe(true);
        expect(has(`eta-2824-2:steps.${s.id}.body`), `${lang} ${s.id} body`).toBe(true);
        if (s.focus === null) expect(has(`eta-2824-2:steps.${s.id}.title`), `${lang} ${s.id} title`).toBe(true);
        for (const st of s.stats) expect(has(`ui:stats.${st.label}`), `${lang} stat ${st.label}`).toBe(true);
      }
      for (const key of new Set(c.parts.map(focusKey))) {
        expect(has(`eta-2824-2:parts.${key}.name`), `${lang} part ${key}`).toBe(true);
      }
    }
  });
});

describe('self-winding content', () => {
  it('does not claim that one rotor direction freewheels', async () => {
    for (const lang of ['ja', 'en'] as const) {
      const i18n = await createI18n(lang);
      const body = i18n.t('eta-2824-2:steps.auto-reversers.body');
      expect(body).not.toMatch(/空回り|freewheels/);
    }
  });
});

describe('watch content', () => {
  it('has a summary for every watch in both languages', async () => {
    for (const lang of ['ja', 'en'] as const) {
      const i18n = await createI18n(lang);
      for (const id of Object.keys(watches)) expect(i18n.getResource(lang, 'watches', `${id}.summary`), `${lang} ${id}`).toBeTypeOf('string');
    }
  });
});
