import { watches } from '../../data/watches';
import { describe, expect, it } from 'vitest';
import { createI18n } from './index';
import { calibers, getCaliber } from '../../data/calibers';
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
  it('has every tour and part string in both languages, for every caliber', async () => {
    for (const lang of ['ja', 'en'] as const) {
      const i18n = await createI18n(lang);
      const has = (key: string) => {
        const [ns, k] = key.split(':');
        return i18n.getResource(lang, ns!, k!) !== undefined;
      };
      for (const cal of Object.values(calibers)) {
        const ns = cal.id;
        for (const ch of cal.chapters) expect(has(`${ns}:chapters.${ch.id}.title`), `${lang} ${ns} chapter ${ch.id}`).toBe(true);
        for (const s of cal.tour) {
          expect(has(`${ns}:steps.${s.id}.kicker`), `${lang} ${ns} ${s.id} kicker`).toBe(true);
          expect(has(`${ns}:steps.${s.id}.body`), `${lang} ${ns} ${s.id} body`).toBe(true);
          if (s.focus === null) expect(has(`${ns}:steps.${s.id}.title`), `${lang} ${ns} ${s.id} title`).toBe(true);
          for (const st of s.stats) expect(has(`ui:stats.${st.label}`), `${lang} stat ${st.label}`).toBe(true);
        }
        for (const key of new Set(cal.parts.map(focusKey))) {
          expect(has(`${ns}:parts.${key}.name`), `${lang} ${ns} part ${key}`).toBe(true);
        }
      }
    }
  });
  it('fills every interpolated caliber value', async () => {
    for (const lang of ['ja', 'en'] as const) {
      const i18n = await createI18n(lang);
      for (const cal of Object.values(calibers))
        for (const s of cal.tour) expect(i18n.t(`${cal.id}:steps.${s.id}.body`, caliberVars(cal)), `${lang} ${cal.id} ${s.id}`).not.toMatch(/{{|undefined|NaN/);
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

describe('Magic Lever content', () => {
  it('explains that the pawl lever winds in both rotor directions', async () => {
    const i18n = await createI18n('en');
    expect(i18n.t('seiko-nh35a:steps.auto-pawl-lever.body')).toMatch(/pull/);
    expect(i18n.t('seiko-nh35a:steps.auto-pawl-lever.body')).toMatch(/push/);
    expect(i18n.t('seiko-nh35a:steps.auto-pawl-lever.body')).toMatch(/whichever way/);
  });
});

describe('chronograph content', () => {
  it('explains the oscillating pinion, the counters and the hearts in both languages', async () => {
    const en = await createI18n('en');
    expect(en.t('valjoux-7750:steps.chrono-pinion.body')).toMatch(/fourth wheel/);
    expect(en.t('valjoux-7750:steps.chrono-hour-counter.body')).toMatch(/barrel/);
    expect(en.t('valjoux-7750:steps.chrono-hammer.body')).toMatch(/heart/);
    for (const lang of ['ja', 'en'] as const) {
      const i18n = await createI18n(lang);
      for (const key of ['startStop', 'reset', 'running', 'stopped', 'zero']) expect(i18n.getResource(lang, 'ui', `chrono.${key}`), `${lang} ${key}`).toBeTypeOf('string');
    }
  });
});
