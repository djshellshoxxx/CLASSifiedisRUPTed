import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { BlockPort } from '@classrup/kernel';
import { DAY, HOUR, MINUTE } from '@classrup/kernel';
import { FINGERPRINT_WINDOW_MS, MAX_BLOCKS_PER_ACCOUNT } from './internals';
import { combine, linkStats } from '../src/policy/spam';
import { ctxFor, member, moderator, setup, system } from './fixtures';
import type { Harness } from './fixtures';

const code = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return (e as { code?: string }).code;
  }
  return undefined;
};

const assess = (h: Harness, accountId: string, over: Partial<{ accountAgeMs: number; textHash: string; text: string }> = {}) =>
  h.mod.assessContent({ accountId, accountAgeMs: 30 * DAY, textHash: 'hash-of-text-1', text: 'Selling a bicycle, barely used.', ...over });

describe('F12.S02.M02 spam heuristics', () => {
  it('allows ordinary content', () => {
    const h = setup();
    expect(assess(h, 'acct_a')).toEqual({ score: 0, decision: 'allow', reasons: [] });
  });

  it('scores duplicate content by how many other accounts posted the same hash', () => {
    const h = setup();
    const scores = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'].map((a) => assess(h, a));
    expect(scores.map((s) => s.score)).toEqual([0, 15, 15, 40, 40, 40, 60]);
    expect(scores[3]).toMatchObject({ decision: 'review', reasons: ['duplicate_content'] });
    expect(scores[6]?.decision).toBe('review');
  });

  it('does not count the same account twice and forgets old fingerprints', () => {
    const h = setup();
    for (let i = 0; i < 3; i++) expect(assess(h, 'a1', { textHash: 'hash-solo-repeat' }).reasons).not.toContain('duplicate_content');
    assess(h, 'a2', { textHash: 'hash-old-content' });
    h.clock.advance(FINGERPRINT_WINDOW_MS + 1);
    expect(assess(h, 'a3', { textHash: 'hash-old-content' }).reasons).not.toContain('duplicate_content');
  });

  it('flags link-heavy text', () => {
    const h = setup();
    const heavy = assess(h, 'a1', { text: 'http://a.io http://b.io http://c.io http://d.io http://e.io buy' });
    expect(heavy).toMatchObject({ score: 45, decision: 'review', reasons: ['link_density'] });
    const light = assess(h, 'a2', { textHash: 'hash-light-links', text: 'See http://a.io and https://b.io for photos of the bike, which has a new chain and tyres and is in great shape' });
    expect(light).toMatchObject({ score: 10, decision: 'allow' });
    expect(linkStats('no links here').links).toBe(0);
  });

  it('flags posting velocity and recovers after the window', () => {
    const h = setup();
    const results = Array.from({ length: 11 }, (_, i) => assess(h, 'a1', { textHash: `hash-velocity-${i}` }));
    expect(results[4]?.reasons).toEqual([]);
    expect(results[5]).toMatchObject({ score: 20, reasons: ['posting_velocity'] });
    expect(results[10]).toMatchObject({ score: 40, reasons: ['posting_velocity'] });
    h.clock.advance(11 * MINUTE);
    expect(assess(h, 'a1', { textHash: 'hash-velocity-after' }).reasons).toEqual([]);
  });

  it('flags bursts from brand-new accounts only', () => {
    const h = setup();
    const post = (acct: string, age: number, i: number) => assess(h, acct, { accountAgeMs: age, textHash: `hash-burst-${acct}-${i}` });
    expect([0, 1, 2].map((i) => post('new', HOUR, i).reasons)).toEqual([[], [], ['new_account_burst']]);
    expect([0, 1, 2].map((i) => post('old', 40 * DAY, i).reasons)).toEqual([[], [], []]);
  });

  it('combines signals into a block decision and never stores the text', () => {
    const h = setup();
    for (const a of ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']) assess(h, a, { textHash: 'hash-spam-wave' });
    const text = 'http://x.io http://y.io http://z.io http://w.io http://v.io win now';
    const r = assess(h, 'a7', { textHash: 'hash-spam-wave', text });
    expect(r).toMatchObject({ score: 100, decision: 'block' });
    expect(r.reasons).toEqual(['duplicate_content', 'link_density']);
    expect(JSON.stringify([h.deps.store.collection('moderation_content_fingerprints').list(), h.deps.store.collection('moderation_post_activity').list()])).not.toContain('win now');
  });

  it('validates input', () => {
    const h = setup();
    expect(code(() => assess(h, 'a1', { textHash: 'x' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => assess(h, 'a1', { accountAgeMs: -1 }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => assess(h, '', {}))).toBe('VALIDATION.INVALID_INPUT');
  });

  it('exposes a system operation that records a spam signal once per idempotency key', () => {
    const h = setup();
    const op = h.mod.spam.assess;
    for (const a of ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']) assess(h, a, { textHash: 'hash-spam-op' });
    const input = { accountId: 'a7', accountAgeMs: 30 * DAY, textHash: 'hash-spam-op', text: 'http://1.io http://2.io http://3.io http://4.io http://5.io go' };
    const first = op(ctxFor(system(), 'key-spam-0001'), input);
    const replay = op(ctxFor(system(), 'key-spam-0001'), input);
    expect(first.decision).toBe('block');
    expect(replay).toEqual(first);
    expect(h.deps.store.collection('moderation_signals').list()).toHaveLength(1);
    expect(h.events.map((e) => e.type)).toEqual(['moderation.spam.flagged', 'moderation.signal.recorded']);
    expect(code(() => op(ctxFor(moderator('acct_m')), input))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => op(ctxFor(system(), 'key-spam-0001'), { ...input, accountId: 'a8' }))).toBe('IDEMPOTENCY.KEY_REUSED');
  });

  it('keeps score within 0..100 and monotonic in other-account duplicates (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 9 }), fc.integer({ min: 0, max: 9 }), (n1, n2) => {
        const scoreFor = (n: number): number => {
          const h = setup();
          for (let i = 0; i < n; i++) assess(h, `other${i}`, { textHash: 'hash-prop-dup' });
          return assess(h, 'subject', { textHash: 'hash-prop-dup' }).score;
        };
        const [lo, hi] = [Math.min(n1, n2), Math.max(n1, n2)];
        const s = scoreFor(hi);
        return scoreFor(lo) <= s && s >= 0 && s <= 100;
      }),
      { numRuns: 25 },
    );
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 1, max: 60 }), { maxLength: 8 }), (points) => {
        const r = combine(points.map((p) => ({ points: p, reason: 'link_density' as const })));
        return r.score <= 100 && (r.decision === 'block') === (r.score >= 70) && (r.decision === 'allow') === (r.score < 40);
      }),
    );
  });
});

describe('F12.S02.M03 abuse: user blocks', () => {
  const block = (h: Harness, by: string, target: string, key?: string) => h.mod.abuse.block(ctxFor(member(by), key), { accountId: target });

  it('blocks, lists and unblocks privately', () => {
    const h = setup();
    const b = block(h, 'acct_a', 'acct_b');
    expect(b).toMatchObject({ blockedId: 'acct_b' });
    expect(h.mod.abuse.list(ctxFor(member('acct_a')), {}).map((x) => x.blockedId)).toEqual(['acct_b']);
    expect(h.mod.abuse.list(ctxFor(member('acct_b')), {})).toEqual([]);
    expect(h.mod.abuse.unblock(ctxFor(member('acct_a')), { accountId: 'acct_b' })).toEqual({ removed: true });
    expect(h.mod.abuse.list(ctxFor(member('acct_a')), {})).toEqual([]);
    expect(h.mod.abuse.unblock(ctxFor(member('acct_a')), { accountId: 'acct_b' })).toEqual({ removed: false });
    expect(h.deps.store.collection('moderation_blocks').count()).toBe(0);
    expect(h.deps.store.collection('moderation_block_index').count()).toBe(0);
  });

  it('implements BlockPort in both directions', () => {
    const h = setup();
    const port: BlockPort = h.mod.blocks;
    expect(port.isBlocked('acct_a', 'acct_b')).toBe(false);
    block(h, 'acct_a', 'acct_b');
    expect(port.isBlocked('acct_a', 'acct_b')).toBe(true);
    expect(port.isBlocked('acct_b', 'acct_a')).toBe(true);
    expect(port.isBlocked('acct_a', 'acct_c')).toBe(false);
    h.mod.abuse.unblock(ctxFor(member('acct_a')), { accountId: 'acct_b' });
    expect(port.isBlocked('acct_b', 'acct_a')).toBe(false);
  });

  it('is idempotent by pair and by key', () => {
    const h = setup();
    const a = block(h, 'acct_a', 'acct_b', 'key-block-001');
    expect(block(h, 'acct_a', 'acct_b', 'key-block-001')).toEqual(a);
    expect(block(h, 'acct_a', 'acct_b')).toEqual(a);
    expect(h.deps.store.collection('moderation_blocks').count()).toBe(1);
    expect(h.events.filter((e) => e.type === 'moderation.block.created')).toHaveLength(1);
    expect(code(() => block(h, 'acct_a', 'acct_c', 'key-block-001'))).toBe('IDEMPOTENCY.KEY_REUSED');
  });

  it('rejects self blocks, bad input and anonymous callers', () => {
    const h = setup();
    expect(code(() => block(h, 'acct_a', 'acct_a'))).toBe('ABUSE.SELF_BLOCK');
    expect(code(() => h.mod.abuse.block(ctxFor(member('acct_a')), { accountId: '' }))).toBe('VALIDATION.INVALID_INPUT');
    const anon = { kind: 'anonymous', id: 'anonymous', roles: [], tenantId: 'tnt_default' } as const;
    expect(code(() => h.mod.abuse.block(ctxFor(anon), { accountId: 'acct_b' }))).toBe('AUTH.REQUIRED');
    expect(code(() => h.mod.abuse.list(ctxFor(anon), {}))).toBe('AUTH.REQUIRED');
  });

  it('keeps blocks out of events: no account ids and a neutral actor', () => {
    const h = setup();
    block(h, 'acct_blocker_x', 'acct_blocked_y');
    h.mod.abuse.unblock(ctxFor(member('acct_blocker_x')), { accountId: 'acct_blocked_y' });
    const blob = JSON.stringify(h.events);
    expect(blob).not.toContain('acct_blocker_x');
    expect(blob).not.toContain('acct_blocked_y');
    expect(h.events.map((e) => e.type)).toEqual(['moderation.block.created', 'moderation.block.removed']);
  });

  it('caps the number of blocks per account', () => {
    const h = setup();
    for (let i = 0; i < MAX_BLOCKS_PER_ACCOUNT; i++) block(h, 'acct_a', `acct_target_${i}`);
    expect(code(() => block(h, 'acct_a', 'acct_one_too_many'))).toBe('ABUSE.BLOCK_LIMIT');
    expect(code(() => block(h, 'acct_b', 'acct_target_1'))).toBeUndefined();
  });
});
