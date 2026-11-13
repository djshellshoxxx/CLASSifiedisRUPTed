import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { createHash } from 'node:crypto';
import { canonicalJson } from '@classrup/kernel';
import * as fairness from './index.ts';
import { EXPLAIN_KEYS, FAIRNESS_CONSTANTS, fairnessErrors, newAuthorSlotPositions, rerank, type RerankedItem } from './index.ts';

const NOW = Date.parse('2026-11-04T10:00:00Z');
const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();
interface Spec { id: number; author: string; score: number; promoted?: boolean; fresh?: boolean; }
const cand = (s: Spec) => ({
  documentId: `d${String(s.id).padStart(4, '0')}`, authorDid: `did:key:z6Mk${s.author}`, score: s.score, promoted: s.promoted ?? false,
  authorFirstSeenAt: iso(NOW - (s.fresh ? 3 : 200) * DAY), firstSeenAt: iso(NOW - 5 * DAY),
  components: { text: 0.5, recency: 0.6, distance: 0.4, matchField: 'title' as const, distanceBucket: '5_10' as const, ageDays: 3 },
});
const sorted = (specs: Spec[]) => specs.map(cand).sort((a, b) => b.score - a.score || (a.documentId < b.documentId ? -1 : 1));
const opts = { now: NOW, promotionEnabled: true };
const run = (list: unknown[], pageSize = 20, windowPosition = 0, o = opts) => { const r = rerank(list, { pageSize, windowPosition }, o); if (!r.ok) throw new Error(r.error.code); return r.value; };
function allPages(list: unknown[], pageSize = 20, o = opts): RerankedItem[][] {
  const pages: RerankedItem[][] = []; let pos: number | null = 0;
  while (pos !== null) { const r = run(list, pageSize, pos, o); pages.push([...r.items]); pos = r.nextWindowPosition; if (pages.length > 400) throw new Error('no progress'); }
  return pages;
}
const authorsOf = (page: readonly RerankedItem[]) => { const m = new Map<string, number>(); for (const i of page) m.set(i.authorDid, (m.get(i.authorDid) ?? 0) + 1); return m; };
const keys = (i: RerankedItem) => i.explain.map(e => e.key);

const corpus = fc.record({
  n: fc.integer({ min: 1, max: 200 }), authors: fc.integer({ min: 1, max: 15 }), seed: fc.integer({ min: 1, max: 1_000_000 }),
  promoShare: fc.double({ min: 0, max: 0.6, noNaN: true }), pageSize: fc.integer({ min: 1, max: 50 }),
});
function build(c: { n: number; authors: number; seed: number; promoShare: number }, withPromo: boolean): ReturnType<typeof cand>[] {
  let x = c.seed;
  const rnd = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
  return sorted(Array.from({ length: c.n }, (_, id) => ({
    id, author: `a${Math.floor(rnd() * c.authors ** 1.5) % c.authors}`, score: Math.round(rnd() * 20) / 20,
    promoted: withPromo && rnd() < c.promoShare, fresh: rnd() < 0.3,
  })));
}

describe('constraints on random corpora', () => {
  it('TEST-PS-050-09.T01 no page exceeds 3 results per author (except flagged only-seller pages), no duplicates, no result dropped across pages', () => {
    fc.assert(fc.property(corpus, c => {
      const list = build(c, false);
      const pages = allPages(list, c.pageSize, { now: NOW, promotionEnabled: false });
      const ids = pages.flat().map(i => i.documentId);
      if (new Set(ids).size !== ids.length) return false;
      if (ids.length !== list.length || [...ids].sort().join() !== list.map(x => x.documentId).sort().join()) return false;
      const remaining = new Map(list.map(item => [item.documentId, item.authorDid]));
      for (const page of pages) {
        if (page.length > c.pageSize) return false;
        const singleSeller = new Set(remaining.values()).size === 1;
        if (page.some(item => item.onlySeller) && !singleSeller) return false;
        for (const item of page) remaining.delete(item.documentId);
        for (const [author, n] of authorsOf(page)) {
          if (n > FAIRNESS_CONSTANTS.maxPerAuthorPerPage && !page.filter(i => i.authorDid === author).every(i => keys(i).includes(EXPLAIN_KEYS.onlySeller))) return false;
        }
      }
      return true;
    }), { numRuns: 200 });
  });

  it('TEST-PS-050-09.T02 promoted results per page never exceed floor(0.2 * page size) and each carries a promoted explanation key', () => {
    fc.assert(fc.property(corpus, c => {
      const list = build(c, true);
      const paidIds = new Set(list.filter(item => item.promoted).map(item => item.documentId));
      if (c.pageSize < 5 && paidIds.size) {
        return !rerank(list, { pageSize: c.pageSize }, opts).ok;
      }
      for (const page of allPages(list, c.pageSize)) {
        const promoted = page.filter(i => paidIds.has(i.documentId));
        if (page.some(i => i.promoted !== paidIds.has(i.documentId))) return false;
        if (promoted.length > Math.floor(c.pageSize / 5)) return false;
        if (!promoted.every(i => keys(i).includes(EXPLAIN_KEYS.promoted))) return false;
        if (page.some(i => !i.promoted && keys(i).includes(EXPLAIN_KEYS.promoted))) return false;
      }
      return true;
    }), { numRuns: 200 });
  });

  it('TEST-PS-050-09.T05 200 runs of the same input are identical and windowed paging never repeats or drops a result', () => {
    const fixed = build({ n: 35, authors: 10, seed: 715, promoShare: 0.3 }, true);
    const expected = allPages(fixed);
    for (let runNumber = 0; runNumber < 200; runNumber++) expect(allPages(fixed)).toEqual(expected);
    fc.assert(fc.property(corpus, c => {
      const list = build(c, c.pageSize >= 5);
      const a = allPages(list, c.pageSize);
      const b = allPages(list, c.pageSize);
      if (JSON.stringify(a) !== JSON.stringify(b)) return false;
      const ids = a.flat().map(i => i.documentId);
      return new Set(ids).size === ids.length && ids.length === list.length;
    }), { numRuns: 200 });
  });
});

describe('new-author slots', () => {
  const prolific = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
  const oldItems = (): Spec[] => prolific.flatMap((a, ai) => [0, 1, 2].map(k => ({ id: ai * 3 + k, author: a, score: 1 - (ai * 3 + k) * 0.001 })));
  it('TEST-PS-050-09.T03 fills 2 slots at positions 5 and 12 with qualifying new authors and none when nobody reaches 50 percent of the top score', () => {
    expect(newAuthorSlotPositions(20)).toEqual([5, 12]);
    const withNew = sorted([...oldItems(), { id: 100, author: 'n1', score: 0.6, fresh: true }, { id: 101, author: 'n2', score: 0.55, fresh: true }, { id: 102, author: 'n3', score: 0.5, fresh: true }]);
    const page = run(withNew).items;
    expect(page).toHaveLength(20);
    expect(page[5]?.newAuthorSlot).toBe(true);
    expect(page[12]?.newAuthorSlot).toBe(true);
    expect(page.filter(i => i.newAuthorSlot).map(i => i.documentId)).toEqual(['d0100', 'd0101']);
    expect(page[5]?.explain.map(e => e.key)).toContain(EXPLAIN_KEYS.newAuthorSlot);
    expect(run(withNew).stats.newAuthorSlotsFilled).toBe(2);
    const weak = sorted([...oldItems(), { id: 100, author: 'n1', score: 0.49, fresh: true }, { id: 101, author: 'n2', score: 0.2, fresh: true }]);
    const none = run(weak);
    expect(none.items.some(i => i.newAuthorSlot)).toBe(false);
    expect(none.stats.newAuthorSlotsFilled).toBe(0);
    expect(none.items.map(i => i.documentId)).toEqual(weak.slice(0, 20).map(c => c.documentId));
    // the same weak authors do not qualify even when they are the only new ones in a short corpus
    expect(run(sorted([{ id: 1, author: 'o', score: 1 }, { id: 2, author: 'n', score: 0.3, fresh: true }])).items.map(i => i.newAuthorSlot)).toEqual([false, false]);
  });

  it('a new author who already ranks near the top keeps that position, and an old author is never given a slot', () => {
    const list = sorted([...oldItems(), { id: 100, author: 'n1', score: 1.5, fresh: true }, { id: 101, author: 'old2', score: 0.9 }]);
    const page = run(list).items;
    expect(page[0]?.documentId).toBe('d0100');
    expect(page[0]?.newAuthorSlot).toBe(true);
    expect(page.filter(i => i.newAuthorSlot)).toHaveLength(1);
  });

  it.each([[0, 1], [1, 3], [3, 8]])('keeps the relevance order of already highly ranked new authors at %i and %i', (a, b) => {
    const list = sorted(Array.from({ length: 25 }, (_, id) => ({
      id, author: String(id), score: 1 - id / 100, fresh: id === a || id === b,
    })));
    const page = run(list).items;
    expect(page.map(item => item.documentId)).toEqual(list.slice(0, 20).map(item => item.documentId));
    expect(page.filter(item => item.newAuthorSlot).map(item => item.documentId))
      .toEqual([list[a]?.documentId, list[b]?.documentId]);
  });

  it('does not reserve a slot for a future first-seen timestamp or one exactly 30 days old', () => {
    const list = sorted([{ id: 1, author: 'a', score: 1 }, { id: 2, author: 'b', score: 0.9 }]);
    const times = [iso(NOW + DAY), iso(NOW - 30 * DAY)];
    expect(run(list.map((item, index) => ({ ...item, authorFirstSeenAt: times[index] }))).stats.newAuthorSlotsFilled).toBe(0);
  });

  it('a promoted new-author item counts once for the promoted cap and does not consume a slot', () => {
    const list = sorted([...oldItems(), { id: 100, author: 'n1', score: 0.995, fresh: true, promoted: true }, { id: 101, author: 'n2', score: 0.6, fresh: true }]);
    const page = run(list).items;
    const promoted = page.find(i => i.documentId === 'd0100');
    expect(promoted?.promoted).toBe(true);
    expect(promoted?.newAuthorSlot).toBe(false);
    expect(page.find(i => i.documentId === 'd0101')?.newAuthorSlot).toBe(true);
    expect(page.filter(i => i.promoted)).toHaveLength(1);
  });

  it('TEST-PS-050-09.T09 a burst of 50 new authors with equal scores fills only 2 slots per page, and none below the 50 percent ratio', () => {
    const burst = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, author: `bot${i}`, score: 0.8, fresh: true }));
    const list = sorted([{ id: 0, author: 'old', score: 0.9 }, ...burst]);
    for (const page of allPages(list)) expect(page.filter(i => i.newAuthorSlot).length).toBeLessThanOrEqual(2);
    expect(run(list).items.filter(i => i.newAuthorSlot)).toHaveLength(2);
    const weak = sorted([{ id: 0, author: 'old', score: 1 }, ...Array.from({ length: 50 }, (_, i) => ({ id: i + 1, author: `bot${i}`, score: 0.4, fresh: true }))]);
    // the 50 percent ratio is measured against the page's own top score, so it is checked on the first page, where the strong item leads
    expect(run(weak).items.some(i => i.newAuthorSlot)).toBe(false);
    expect(run(weak).stats.newAuthorSlotsFilled).toBe(0);
  });
});

describe('validation and inputs', () => {
  const good = () => sorted([{ id: 1, author: 'a', score: 0.9 }, { id: 2, author: 'b', score: 0.8 }, { id: 3, author: 'c', score: 0.7 }]);
  const code = (r: ReturnType<typeof rerank>) => (r.ok ? 'OK' : r.error.code);
  it('TEST-PS-050-09.T04 NaN score, duplicate ids, limit 51, unsorted input and a promoted flag where promotion is off are rejected with typed errors and no partial page', () => {
    const g = good();
    expect(code(rerank([{ ...g[0], score: Number.NaN }, ...g.slice(1)], {}, opts))).toBe('VALIDATION_FAILED');
    expect(code(rerank([{ ...g[0], score: -1 }, ...g.slice(1)], {}, opts))).toBe('VALIDATION_FAILED');
    expect(code(rerank([{ ...g[0], score: Number.POSITIVE_INFINITY }, ...g.slice(1)], {}, opts))).toBe('VALIDATION_FAILED');
    expect(code(rerank([g[0], { ...g[1], documentId: g[0]?.documentId }], {}, opts))).toBe('VALIDATION_FAILED');
    expect(code(rerank(g, { pageSize: 51 }, opts))).toBe('VALIDATION_FAILED');
    expect(code(rerank(g, { pageSize: 0 }, opts))).toBe('VALIDATION_FAILED');
    expect(code(rerank(g, { pageSize: 2.5 }, opts))).toBe('VALIDATION_FAILED');
    expect(code(rerank(g, { windowPosition: 3 }, opts))).toBe('VALIDATION_FAILED');
    expect(code(rerank(g, { windowPosition: -1 }, opts))).toBe('VALIDATION_FAILED');
    expect(code(rerank([g[1], g[0], g[2]], {}, opts))).toBe('FAIRNESS_INPUT_UNSORTED');
    const tied = [{ ...g[0], score: 0.5, documentId: 'd9' }, { ...g[1], score: 0.5, documentId: 'd1' }];
    expect(code(rerank(tied, {}, opts))).toBe('FAIRNESS_INPUT_UNSORTED');
    expect(code(rerank([{ ...g[0], promoted: true }, ...g.slice(1)], {}, { now: NOW, promotionEnabled: false }))).toBe('FAIRNESS_PROMOTION_NOT_ALLOWED');
    const r = rerank([{ ...g[0], promoted: true }, ...g.slice(1)], {}, { now: NOW, promotionEnabled: false });
    expect(!r.ok && r.error.status).toBe(422);
    expect(rerank(g, {}, opts).ok).toBe(true);
  });

  it('TEST-PS-050-09.T08 candidate objects with extra fields such as userId, reputation or bio are rejected; the clean ranking is unaffected', () => {
    const g = good();
    for (const extra of [{ userId: 'u1' }, { reputation: 9 }, { bio: 'hello' }]) {
      expect(code(rerank([{ ...g[0], ...extra }, ...g.slice(1)], {}, opts))).toBe('VALIDATION_FAILED');
    }
    expect(code(rerank([{ ...g[0], components: { ...g[0]?.components, userId: 'u1' } }, ...g.slice(1)], {}, opts))).toBe('VALIDATION_FAILED');
    const before = JSON.stringify(run(g));
    const stripped = g.map(c => { const { userId: _u, ...rest } = { ...c, userId: 'u1' }; return rest; });
    expect(JSON.stringify(run(stripped))).toBe(before);
    expect(JSON.stringify(run(g))).not.toMatch(/userId|reputation|bio/);
  });

  it('a window with fewer than 20 items is returned as is, and only the top 200 candidates are windowed', () => {
    const few = run(sorted(Array.from({ length: 5 }, (_, i) => ({ id: i, author: `a${i}`, score: 1 - i * 0.1 }))));
    expect(few.items).toHaveLength(5);
    expect(few.nextWindowPosition).toBeNull();
    const many = sorted(Array.from({ length: 450 }, (_, i) => ({ id: i, author: `a${i % 40}`, score: 1 - i * 0.001 })));
    expect(allPages(many).flat()).toHaveLength(200);
    expect(rerank([], {}, opts)).toMatchObject({ ok: true, value: { items: [], nextWindowPosition: null } });
    expect(code(rerank([], { windowPosition: 20 }, opts))).toBe('VALIDATION_FAILED');
  });
});

describe('page rules', () => {
  it('TEST-PS-050-09.T06 a single-author page of 7 relaxes the cap with only_seller, with promoted cap 1 and 1 new-author slot', () => {
    expect(newAuthorSlotPositions(7)).toHaveLength(1);
    const single = sorted(Array.from({ length: 20 }, (_, i) => ({ id: i, author: 'solo', score: 1 - i * 0.01, promoted: i === 1 || i === 2 })));
    const page = run(single, 7);
    expect(page.items).toHaveLength(7);
    expect(page.items.every(i => keys(i).includes(EXPLAIN_KEYS.onlySeller))).toBe(true);
    expect(page.items.filter(i => i.promoted)).toHaveLength(1);
    const withNew = sorted([...Array.from({ length: 12 }, (_, i) => ({ id: i, author: `o${i % 4}`, score: 1 - i * 0.01, promoted: true })), { id: 50, author: 'n1', score: 0.7, fresh: true }, { id: 51, author: 'n2', score: 0.65, fresh: true }]);
    const p7 = run(withNew, 7);
    expect(p7.items.filter(i => i.promoted)).toHaveLength(1);
    expect(p7.items.filter(i => i.newAuthorSlot)).toHaveLength(1);
    expect(p7.stats.promotedDemoted).toBeGreaterThan(0);
    // other sellers present: the cap holds and nobody is flagged
    const mixed = sorted(Array.from({ length: 12 }, (_, i) => ({ id: i, author: ['a', 'b', 'c'][i % 3] as string, score: 1 - i * 0.01 })));
    const mp = run(mixed, 7).items;
    expect(mp).toHaveLength(7);
    expect([...authorsOf(mp).values()].every(n => n <= 3)).toBe(true);
    expect(mp.some(i => keys(i).includes(EXPLAIN_KEYS.onlySeller))).toBe(false);
  });

  it('keeps the per-author cap on short multi-seller pages, then relaxes it when only one seller remains', () => {
    const list = sorted(Array.from({ length: 20 }, (_, id) => ({
      id, author: id < 14 ? 'a' : 'b', score: 1 - id / 100,
    })));
    const pages = allPages(list);
    expect(pages.map(page => page.length)).toEqual([6, 6, 8]);
    for (const page of pages.slice(0, 2)) {
      expect([...authorsOf(page).values()]).toEqual([3, 3]);
      expect(page.some(item => item.onlySeller)).toBe(false);
    }
    expect(pages[2]?.every(item => item.onlySeller && keys(item).includes(EXPLAIN_KEYS.onlySeller))).toBe(true);
    expect(new Set(pages.flat().map(item => item.documentId)).size).toBe(list.length);
  });

  it('demotes excess promoted results to the next page and rejects paid scores for a zero promotion quota', () => {
    const list = sorted(Array.from({ length: 40 }, (_, i) => ({ id: i, author: `a${i % 20}`, score: 1 - i * 0.01, promoted: i < 8 })));
    const [p1, p2] = allPages(list);
    expect(p1?.filter(i => i.promoted)).toHaveLength(4);
    expect(p2?.filter(i => i.promoted)).toHaveLength(4);
    expect(p1?.slice(0, 4).map(i => i.promoted)).toEqual([true, true, true, true]);
    for (const pageSize of [1, 2, 3, 4]) {
      expect(rerank(list, { pageSize }, opts)).toMatchObject({
        ok: false, error: { code: 'VALIDATION_FAILED', fields: [{ path: 'pageSize', code: 'PROMOTED_QUOTA_ZERO' }] },
      });
      // This fixture is rescored organically: score is independent of the original promoted flag.
      const organic = list.map(item => ({ ...item, promoted: false }));
      expect(allPages(organic, pageSize).flat().map(item => item.documentId))
        .toEqual(organic.map(item => item.documentId));
    }
  });

  it('builds explanations from score components as message keys with parameters', () => {
    const [first] = run(sorted([{ id: 1, author: 'a', score: 0.9 }])).items;
    expect(first?.explain).toEqual([
      { key: EXPLAIN_KEYS.textMatch, params: { field: 'title' } }, { key: EXPLAIN_KEYS.recent, params: { ageDays: 3 } }, { key: EXPLAIN_KEYS.distanceBucket, params: { bucket: '5_10' } },
    ]);
    const weak = { ...cand({ id: 2, author: 'b', score: 0.5 }), components: { text: null, recency: 0.1, distance: null, defaultRanking: true } };
    expect(run([weak]).items[0]?.explain).toEqual([{ key: EXPLAIN_KEYS.defaultRanking, params: {} }]);
  });

  it('ties on score fall back to firstSeenAt then documentId in the input contract', () => {
    const a = { ...cand({ id: 1, author: 'a', score: 0.5 }), firstSeenAt: iso(NOW - DAY) };
    const b = { ...cand({ id: 2, author: 'b', score: 0.5 }), firstSeenAt: iso(NOW - 2 * DAY) };
    const c = { ...cand({ id: 3, author: 'c', score: 0.5 }), firstSeenAt: iso(NOW - 2 * DAY) };
    expect(run([a, b, c]).items.map(i => i.documentId)).toEqual(['d0001', 'd0002', 'd0003']);
    expect(rerank([b, a, c], {}, opts).ok).toBe(false);
  });
});

describe('purity and exports', () => {
  it('TEST-PS-050-09.T10 repeat and concurrent calls after an invalid request share no state and return the same result', async () => {
    const list = Object.freeze(sorted(Array.from({ length: 60 }, (_, i) => ({ id: i, author: `a${i % 9}`, score: 1 - i * 0.01, promoted: i % 7 === 0, fresh: i % 5 === 0 }))));
    const baseline = JSON.stringify(rerank(list, {}, opts));
    expect(rerank({ length: 1 } as never, {}, opts)).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    expect(rerank([], null as never, opts)).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    expect(rerank([], {}, undefined as never)).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    expect(rerank(list, {}, { ...opts, promotionEnabled: 'false' } as never)).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    expect(rerank([null], {}, opts).ok).toBe(false);
    expect(JSON.stringify(rerank(list, {}, opts))).toBe(baseline);
    const results = await Promise.all(Array.from({ length: 20 }, async () => JSON.stringify(rerank(list, {}, opts))));
    expect(new Set(results)).toEqual(new Set([baseline]));
  });

  it('TEST-PS-050-09.T07 exposes functions only: no commands, queries or events, and typed errors only', () => {
    for (const value of Object.values(fairness)) {
      const kind = (value as { kind?: unknown } | null)?.kind;
      expect(['command', 'query', 'subscriber']).not.toContain(kind);
    }
    expect(Object.keys(fairnessErrors.codes).sort()).toEqual(['FAIRNESS_INPUT_UNSORTED', 'FAIRNESS_PROMOTION_NOT_ALLOWED']);
    expect(Object.keys(fairness).filter(k => /Repo$|Definitions$|Event$/.test(k))).toEqual([]);
  });

  it('TEST-PS-050-09.T13 owns no persistence and its constants match the golden hash', () => {
    expect(Object.keys(fairness).filter(k => /repo|storage|store/i.test(k))).toEqual([]);
    expect(FAIRNESS_CONSTANTS).toEqual({ version: 1, windowSize: 200, defaultPageSize: 20, minPageSize: 1, maxPageSize: 50, maxPerAuthorPerPage: 3, newAuthorWindowDays: 30, newAuthorSlotsPer20: 2, newAuthorMinScoreRatio: 0.5, promotedMaxShare: 0.2 });
    expect(createHash('sha256').update(canonicalJson(FAIRNESS_CONSTANTS)).digest('hex')).toBe('2eb81ac3eb3b7375e81ec26a191b6ff0cbb99108475d1c22f26f9d5bb987d94b');
    expect(Object.isFrozen(FAIRNESS_CONSTANTS)).toBe(true);
  });
});
