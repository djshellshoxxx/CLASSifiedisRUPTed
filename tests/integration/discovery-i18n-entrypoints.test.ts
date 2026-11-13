import { expect, it } from 'vitest';
import { DEFAULT_RANKING_CONFIG, discoveryDefinitions, rankCandidates, rerank } from '@classrup/discovery';
import { createI18n, formatMoney, parseMoneyInput, type CurrencySpec } from '@classrup/i18n';

it('ranks and pages search results through the discovery package alongside the existing listing operations', () => {
  const existing = discoveryDefinitions({ verifyEnvelope: async () => { throw new Error('not used in this test'); } });
  expect(existing.all.map(def => def.name)).toContain('discovery.listing.search');

  const firstSeenAt = '2026-11-04T10:00:00.000Z';
  const now = Date.parse(firstSeenAt);
  const docs = ['b', 'a'].map(documentId => ({ documentId, firstSeenAt }));
  const ranking = rankCandidates(docs, DEFAULT_RANKING_CONFIG, { hasText: false, hasDistance: false, promotionEnabled: false, now });
  if (!ranking.ok) throw new Error(ranking.error.code);
  const candidates = ranking.value.map(item => ({
    documentId: item.documentId, authorDid: `author-${item.documentId}`, score: item.score,
    firstSeenAt: item.firstSeenAt, authorFirstSeenAt: firstSeenAt, promoted: item.promotedLabel,
    components: { text: item.components.text, recency: item.components.recency, distance: item.components.distance },
  }));
  const page = rerank(candidates, { pageSize: 1 }, { now, promotionEnabled: false });
  expect(page).toMatchObject({ ok: true, value: { items: [{ documentId: 'a' }], nextWindowPosition: 1 } });
});

it('uses a negotiated language to render and parse exact listing amounts through the i18n package', async () => {
  const i18n = createI18n({
    en: { 'listing.price': 'Price: {amount}' }, supported: ['en', 'fr'],
    loadCatalog: async () => ({ 'listing.price': 'Prix : {amount}' }),
  });
  const { locale } = await i18n.setLocale('fr-CA');
  expect(locale).toBe('fr');
  const spec: CurrencySpec = { code: 'EUR', exponent: 2, kind: 'iso' };
  const money = { amount: '12345', currency: 'EUR' };
  const amount = formatMoney(money, spec, locale);
  if (!amount.ok) throw new Error(amount.error.code);
  expect(i18n.t('listing.price', { amount: amount.value }).replace(/\s/gu, ' ')).toBe('Prix : 123,45 €');
  expect(parseMoneyInput('123,45', spec, locale)).toEqual({ ok: true, value: money.amount });
});
