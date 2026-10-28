import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { AccountSnapshot, RiskInput } from '@classrup/kernel';
import { createTestDeps, DAY, HOUR, MINUTE, SECOND } from '@classrup/kernel';
import { CHALLENGE_THRESHOLD, DEFAULT_SIGNAL_WEIGHTS, DENY_THRESHOLD, HALF_LIFE_MS, decayedWeight, scoreSignals, sensitivityFor, TIER_LIMITS } from '../src/index';
import type { RatePolicy } from '../src/index';
import { collectionsOf } from '../src/common';
import { createRateLimiter } from '../src/antifraud/rate';
import { decisionFor } from '../src/antifraud/risk';
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

const record = (h: Harness, accountId: string, kind: Parameters<Harness['mod']['recordSignal']>[1]['kind'], weight?: number) =>
  h.mod.recordSignal(ctxFor(system()), { accountId, kind, ...(weight !== undefined ? { weight } : {}) });
const riskOf = (h: Harness, accountId: string, action = 'bazaar.listing.publish') =>
  h.mod.risk.assess({ actor: { kind: 'user', id: accountId, roles: ['member'], tenantId: 'tnt_default' }, action });

describe('F12.S03.M02 signals', () => {
  it('records weighted signals with defaults and overrides', () => {
    const h = setup();
    expect(record(h, 'acct_a', 'txhash_reuse')).toMatchObject({ kind: 'txhash_reuse', weight: DEFAULT_SIGNAL_WEIGHTS.txhash_reuse, currentWeight: 40, revoked: false });
    expect(record(h, 'acct_a', 'payment_failed', 7).weight).toBe(7);
    expect(h.mod.signals.list(ctxFor(moderator('acct_m')), { accountId: 'acct_a' })).toHaveLength(2);
    expect(h.events.map((e) => e.type)).toEqual(['moderation.signal.recorded', 'moderation.signal.recorded']);
  });

  it('halves the current weight every 30 days', () => {
    const h = setup();
    record(h, 'acct_a', 'dispute_lost', 64);
    const current = () => h.mod.signals.list(ctxFor(moderator('acct_m')), { accountId: 'acct_a' })[0]?.currentWeight;
    expect(current()).toBe(64);
    h.clock.advance(HALF_LIFE_MS);
    expect(current()).toBe(32);
    h.clock.advance(HALF_LIFE_MS);
    expect(current()).toBe(16);
  });

  it('is system-write and staff-read only, and validates input', () => {
    const h = setup();
    expect(code(() => h.mod.recordSignal(ctxFor(member('acct_a')), { accountId: 'acct_a', kind: 'dispute_lost' }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => h.mod.recordSignal(ctxFor(moderator('acct_m')), { accountId: 'acct_a', kind: 'dispute_lost' }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => h.mod.signals.list(ctxFor(member('acct_a')), { accountId: 'acct_a' }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => record(h, 'acct_a', 'dispute_lost', 0))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => record(h, 'acct_a', 'dispute_lost', 101))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => record(h, 'acct_a', 'made_up' as never))).toBe('VALIDATION.INVALID_INPUT');
  });

  it('replays by idempotency key and rejects key reuse', () => {
    const h = setup();
    const input = { accountId: 'acct_a', kind: 'chargeback_claim' } as const;
    const a = h.mod.recordSignal(ctxFor(system(), 'key-signal-01'), input);
    expect(h.mod.recordSignal(ctxFor(system(), 'key-signal-01'), input)).toEqual(a);
    expect(h.deps.store.collection('moderation_signals').count()).toBe(1);
    expect(code(() => h.mod.recordSignal(ctxFor(system(), 'key-signal-01'), { ...input, kind: 'dispute_lost' }))).toBe('IDEMPOTENCY.KEY_REUSED');
  });
});

describe('F12.S03.M01 risk', () => {
  it('allows accounts with no signals and explains why', () => {
    const h = setup();
    expect(riskOf(h, 'acct_clean')).toEqual({ decision: 'allow', score: 0, reasons: ['sensitivity:standard:x1', 'no_active_signals'] });
  });

  it('maps scores to allow < 40 <= challenge < 75 <= deny', () => {
    expect([0, 39].map(decisionFor)).toEqual(['allow', 'allow']);
    expect([CHALLENGE_THRESHOLD, 74].map(decisionFor)).toEqual(['challenge', 'challenge']);
    expect([DENY_THRESHOLD, 100].map(decisionFor)).toEqual(['deny', 'deny']);
    const h = setup();
    record(h, 'acct_a', 'txhash_reuse');
    expect(riskOf(h, 'acct_a')).toMatchObject({ decision: 'challenge', score: 40 });
    record(h, 'acct_a', 'dispute_lost', 40);
    expect(riskOf(h, 'acct_a')).toMatchObject({ decision: 'deny', score: 80 });
  });

  it('weighs signals by how sensitive the action is', () => {
    const h = setup();
    record(h, 'acct_a', 'chargeback_claim');
    const at = (action: string) => riskOf(h, 'acct_a', action);
    expect(at('comms.message.send')).toMatchObject({ decision: 'allow', score: 18 });
    expect(at('bazaar.listing.publish')).toMatchObject({ decision: 'allow', score: 30 });
    expect(at('commerce.payment.claim')).toMatchObject({ decision: 'challenge', score: 45 });
    expect(at('commerce.payment.claim').reasons).toEqual(['signal:chargeback_claim:+45', 'sensitivity:high:x1.5']);
    expect([sensitivityFor('mutiny.cycle.propose'), sensitivityFor('comms.thread.open'), sensitivityFor('unknown.thing.do')]).toEqual(['high', 'low', 'standard']);
  });

  it('lets risk fade as signals decay and ignores revoked or ancient ones', () => {
    const h = setup();
    record(h, 'acct_a', 'dispute_lost', 80);
    expect(riskOf(h, 'acct_a').decision).toBe('deny');
    h.clock.advance(HALF_LIFE_MS);
    expect(riskOf(h, 'acct_a')).toMatchObject({ decision: 'challenge', score: 40 });
    h.clock.advance(HALF_LIFE_MS);
    expect(riskOf(h, 'acct_a')).toMatchObject({ decision: 'allow', score: 20 });
    h.clock.advance(300 * DAY);
    expect(riskOf(h, 'acct_a').score).toBe(0);
  });

  it('does not score system actors and exposes a staff operation', () => {
    const h = setup();
    record(h, 'acct_a', 'dispute_lost', 80);
    expect(h.mod.risk.assess({ actor: system(), action: 'x.y.z' }).score).toBe(0);
    expect(h.mod.riskScoring.assess(ctxFor(moderator('acct_m')), { accountId: 'acct_a', action: 'bazaar.listing.publish' }).decision).toBe('deny');
    expect(h.mod.riskScoring.assess(ctxFor(system()), { accountId: 'acct_a', action: 'bazaar.listing.publish' }).score).toBe(80);
    expect(code(() => h.mod.riskScoring.assess(ctxFor(member('acct_a')), { accountId: 'acct_a', action: 'bazaar.listing.publish' }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => h.mod.riskScoring.assess(ctxFor(moderator('acct_m')), { accountId: 'acct_a', action: '' }))).toBe('VALIDATION.INVALID_INPUT');
  });

  const kinds = fc.constantFrom(...(Object.keys(DEFAULT_SIGNAL_WEIGHTS) as (keyof typeof DEFAULT_SIGNAL_WEIGHTS)[]));
  const signal = fc.record({ kind: kinds, weight: fc.integer({ min: 1, max: 100 }), at: fc.integer({ min: 0, max: 200 * DAY }) });

  it('score is monotonic in signal weight and in the number of signals (property)', () => {
    fc.assert(
      fc.property(fc.array(signal, { maxLength: 8 }), signal, fc.integer({ min: 0, max: 100 }), fc.constantFrom(60, 100, 150), (signals, extra, bump, percent) => {
        const now = 250 * DAY;
        const base = scoreSignals(signals, now, percent).score;
        const heavier = scoreSignals(signals.map((s, i) => (i === 0 ? { ...s, weight: s.weight + bump } : s)), now, percent).score;
        const more = scoreSignals([...signals, extra], now, percent).score;
        return heavier >= base && more >= base && base >= 0 && more <= 100;
      }),
    );
  });

  it('score never rises as time passes (property)', () => {
    fc.assert(
      fc.property(fc.array(signal, { maxLength: 8 }), fc.integer({ min: 0, max: 400 * DAY }), fc.integer({ min: 0, max: 400 * DAY }), (signals, t1, t2) => {
        const [early, late] = [200 * DAY + Math.min(t1, t2), 200 * DAY + Math.max(t1, t2)];
        return scoreSignals(signals, late, 100).score <= scoreSignals(signals, early, 100).score;
      }),
    );
    fc.assert(fc.property(fc.integer({ min: 1, max: 100 }), fc.integer({ min: 0, max: 5 }), (w, halfLives) => Math.abs(decayedWeight(w, halfLives * HALF_LIFE_MS) - w / 2 ** halfLives) < 1e-9));
  });

  it('matches the pure scorer through the port (property)', () => {
    fc.assert(
      fc.property(fc.array(fc.record({ kind: kinds, weight: fc.integer({ min: 1, max: 100 }), wait: fc.integer({ min: 0, max: 40 * DAY }) }), { maxLength: 6 }), (steps) => {
        const h = setup();
        for (const s of steps) {
          h.clock.advance(s.wait);
          record(h, 'acct_p', s.kind, s.weight);
        }
        const expected = scoreSignals(h.deps.store.collection<{ id: string; version: number; kind: string; weight: number; at: number }>('moderation_signals').list(), h.clock.now(), 100).score;
        const input: RiskInput = { actor: { kind: 'user', id: 'acct_p', roles: ['member'], tenantId: 'tnt_default' }, action: 'bazaar.listing.publish' };
        return h.mod.risk.assess(input).score === expected;
      }),
      { numRuns: 25 },
    );
  });
});

describe('F12.S03.M03 rate limiting', () => {
  const policy = (over: Partial<RatePolicy> = {}): RatePolicy => ({ prefix: '', capacity: 3, refillTokens: 1, refillIntervalMs: 10 * SECOND, ...over });
  const limiterWith = (policies: RatePolicy[]) => {
    const deps = createTestDeps();
    return { deps, limiter: createRateLimiter(deps, collectionsOf(deps), policies) };
  };

  it('allows a burst up to capacity, then reports when to retry', () => {
    const { limiter } = limiterWith([policy()]);
    for (let i = 0; i < 3; i++) limiter.consume('k');
    let err: { code: string; category: string; details: { retryAfterMs: number }; retryable: boolean } | undefined;
    try {
      limiter.consume('k');
    } catch (e) {
      err = e as typeof err;
    }
    expect(err).toMatchObject({ code: 'RATE.LIMITED', category: 'rate_limited', retryable: true, details: { retryAfterMs: 10 * SECOND } });
  });

  it('refills deterministically with the clock and keeps keys independent', () => {
    const { deps, limiter } = limiterWith([policy()]);
    for (let i = 0; i < 3; i++) limiter.consume('a');
    limiter.consume('b');
    expect(limiter.available('a')).toBe(0);
    deps.clock.advance(5 * SECOND);
    expect(code(() => limiter.consume('a'))).toBe('RATE.LIMITED');
    deps.clock.advance(5 * SECOND);
    limiter.consume('a');
    expect(limiter.available('a')).toBe(0);
    expect(limiter.available('b')).toBe(3);
    deps.clock.advance(HOUR);
    expect(limiter.available('a')).toBe(3);
  });

  it('selects the longest matching prefix and rejects bad policies and costs', () => {
    const { limiter } = limiterWith([policy({ capacity: 10 }), policy({ prefix: 'report:', capacity: 2 }), policy({ prefix: 'report:vip:', capacity: 5 })]);
    expect([limiter.policyFor('x').capacity, limiter.policyFor('report:a').capacity, limiter.policyFor('report:vip:a').capacity]).toEqual([10, 2, 5]);
    expect(() => limiterWith([policy({ prefix: 'x:' })])).toThrow(TypeError);
    expect(() => limiterWith([policy({ capacity: 0 })])).toThrow(TypeError);
    for (const cost of [0, 1.5, -1, 11]) expect(code(() => limiter.consume('k', cost))).toBe('RATE.INVALID_COST');
    limiter.consume('k', 10);
    expect(code(() => limiter.consume('k'))).toBe('RATE.LIMITED');
  });

  it('persists in the store: a second limiter instance continues the same buckets', () => {
    const { deps, limiter } = limiterWith([policy()]);
    limiter.consume('k', 2);
    const again = createRateLimiter(deps, collectionsOf(deps), [policy()]);
    expect(again.available('k')).toBe(1);
    again.consume('k');
    expect(code(() => limiter.consume('k'))).toBe('RATE.LIMITED');
    expect(deps.store.collection('moderation_buckets').count()).toBe(1);
  });

  it('does not keep tokens consumed by a transaction that rolls back', () => {
    const { deps, limiter } = limiterWith([policy()]);
    expect(() =>
      deps.store.transaction(() => {
        limiter.consume('k', 2);
        throw new Error('later step failed');
      }),
    ).toThrow('later step failed');
    expect(limiter.available('k')).toBe(3);
  });

  it('is wired as the module rateLimiter with the default policy table', () => {
    const h = setup();
    expect(h.mod.rateLimiter.policyFor('report:acct_a')).toMatchObject({ prefix: 'report:', capacity: 5 });
    expect(h.mod.rateLimiter.policyFor('anything:else').prefix).toBe('');
    for (let i = 0; i < 30; i++) h.mod.rateLimiter.consume('message.send:acct_a');
    expect(code(() => h.mod.rateLimiter.consume('message.send:acct_a'))).toBe('RATE.LIMITED');
  });

  const ops = fc.array(fc.record({ wait: fc.integer({ min: 0, max: 30 * SECOND }), cost: fc.integer({ min: 1, max: 4 }) }), { maxLength: 40 });
  const policies = fc.record({ capacity: fc.integer({ min: 4, max: 10 }), refillTokens: fc.integer({ min: 1, max: 5 }), refillIntervalMs: fc.integer({ min: SECOND, max: MINUTE }) });

  it('never admits more than capacity + refill * elapsed (property)', () => {
    fc.assert(
      fc.property(policies, ops, (p, sequence) => {
        const { deps, limiter } = limiterWith([{ prefix: '', ...p }]);
        let consumed = 0;
        let elapsed = 0;
        for (const op of sequence) {
          deps.clock.advance(op.wait);
          elapsed += op.wait;
          try {
            limiter.consume('k', op.cost);
            consumed += op.cost;
          } catch (e) {
            if ((e as { code?: string }).code !== 'RATE.LIMITED') throw e;
          }
          if (consumed * p.refillIntervalMs > p.capacity * p.refillIntervalMs + p.refillTokens * elapsed) return false;
        }
        return true;
      }),
    );
  });

  it('retryAfterMs is exact: one ms earlier still fails, then it succeeds (property)', () => {
    fc.assert(
      fc.property(policies, fc.integer({ min: 1, max: 4 }), (p, cost) => {
        const { deps, limiter } = limiterWith([{ prefix: '', ...p }]);
        limiter.consume('k', p.capacity);
        let retryAfterMs = 0;
        try {
          limiter.consume('k', cost);
        } catch (e) {
          retryAfterMs = (e as { details: { retryAfterMs: number } }).details.retryAfterMs;
        }
        deps.clock.advance(retryAfterMs - 1);
        const early = code(() => limiter.consume('k', cost));
        deps.clock.advance(1);
        return retryAfterMs > 0 && early === 'RATE.LIMITED' && code(() => limiter.consume('k', cost)) === undefined;
      }),
    );
  });

  it('is deterministic: identical histories give identical outcomes (property)', () => {
    fc.assert(
      fc.property(policies, ops, (p, sequence) => {
        const run = () => {
          const { deps, limiter } = limiterWith([{ prefix: '', ...p }]);
          return sequence.map((op) => {
            deps.clock.advance(op.wait);
            return code(() => limiter.consume('k', op.cost)) ?? 'ok';
          });
        };
        return JSON.stringify(run()) === JSON.stringify(run());
      }),
    );
  });
});

describe('F12.S03.M04 limits and trust tiers', () => {
  const account = (id: string, createdAt: number): AccountSnapshot => ({
    id,
    tenantId: 'tnt_default',
    pseudonym: id,
    status: 'active',
    signingKeyIds: [],
    boxKeyIds: [],
    createdAt,
  });

  it('derives the tier from account age, strikes and risk', () => {
    const h = setup();
    const tier = (age: number, id = 'acct_a') => h.mod.limits.tierOf(id, age);
    expect([tier(0), tier(7 * DAY - 1), tier(7 * DAY), tier(89 * DAY), tier(90 * DAY)]).toEqual(['new', 'new', 'established', 'established', 'trusted']);
    record(h, 'acct_risky', 'dispute_lost');
    expect(tier(120 * DAY, 'acct_risky')).toBe('established');
    h.clock.advance(60 * DAY);
    expect(tier(120 * DAY, 'acct_risky')).toBe('trusted');
  });

  it('drops an old account to established while it has an active strike', () => {
    const h = setup();
    h.owners.set('listing:lst_1', 'acct_seller');
    h.decide(h.claimedCase().id);
    expect(h.mod.limits.tierOf('acct_seller', 200 * DAY)).toBe('established');
    h.clock.advance(181 * DAY);
    expect(h.mod.limits.tierOf('acct_seller', 200 * DAY)).toBe('trusted');
  });

  it('exposes limits per tier that never shrink with trust', () => {
    const h = setup();
    expect(h.mod.limitFor('acct_a', 0, 'listings_per_day')).toBe(TIER_LIMITS.new.listings_per_day);
    expect(h.mod.limitFor('acct_a', 100 * DAY, 'open_offers')).toBe(TIER_LIMITS.trusted.open_offers);
    expect(h.mod.limitFor('acct_a', 10 * DAY, 'auction_max_value')).toBe(100_000n);
    for (const k of ['listings_per_day', 'open_offers', 'open_trades', 'messages_per_hour', 'auction_max_value'] as const) {
      expect(TIER_LIMITS.new[k] <= TIER_LIMITS.established[k] && TIER_LIMITS.established[k] <= TIER_LIMITS.trusted[k]).toBe(true);
    }
  });

  it('throws LIMITS.EXCEEDED past the tier limit, with details but no leakage', () => {
    const h = setup();
    expect(() => h.mod.checkLimit('acct_a', 0, 'listings_per_day', 2, 1)).not.toThrow();
    let err: { code: string; category: string; details: Record<string, unknown> } | undefined;
    try {
      h.mod.checkLimit('acct_a', 0, 'listings_per_day', 3, 1);
    } catch (e) {
      err = e as typeof err;
    }
    expect(err).toMatchObject({ code: 'LIMITS.EXCEEDED', category: 'precondition', details: { kind: 'listings_per_day', tier: 'new', limit: '3', used: '3' } });
    expect(() => h.mod.checkLimit('acct_a', 0, 'auction_max_value', 0n, 10_000n)).not.toThrow();
    expect(code(() => h.mod.checkLimit('acct_a', 0, 'auction_max_value', 0n, 10_001n))).toBe('LIMITS.EXCEEDED');
  });

  it('admits exactly when used + requested fits the limit (property)', () => {
    const h = setup();
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 400 * DAY }), fc.integer({ min: 0, max: 400 }), fc.integer({ min: 1, max: 20 }), (age, used, req) => {
        const limit = h.mod.limitFor('acct_prop', age, 'messages_per_hour');
        return (code(() => h.mod.checkLimit('acct_prop', age, 'messages_per_hour', used, req)) === undefined) === (used + req <= limit);
      }),
    );
  });

  it('serves the caller their own tier through the accounts port', () => {
    const accounts = new Map<string, AccountSnapshot>();
    const h = setup({ accounts });
    accounts.set('acct_a', account('acct_a', h.clock.now() - 10 * DAY));
    expect(h.mod.limits.mine(ctxFor(member('acct_a')))).toMatchObject({ tier: 'established', limits: { listings_per_day: 10, auction_max_value_minor: '100000' } });
    expect(code(() => h.mod.limits.mine(ctxFor(member('acct_ghost'))))).toBe('LIMITS.ACCOUNT_NOT_FOUND');
    expect(h.mod.limits.mine(ctxFor(member('acct_a')))).not.toHaveProperty('accountAgeMs');
  });

  it('needs the accounts port for self-service, and checks quotas for the system only', () => {
    const h = setup();
    expect(code(() => h.mod.limits.mine(ctxFor(member('acct_a'))))).toBe('LIMITS.ACCOUNTS_UNAVAILABLE');
    const input = { accountId: 'acct_a', accountAgeMs: 0, kind: 'open_trades', used: 2 } as const;
    expect(h.mod.limits.check(ctxFor(system()), { ...input, used: 1 })).toEqual({ allowed: true, tier: 'new' });
    expect(code(() => h.mod.limits.check(ctxFor(system()), input))).toBe('LIMITS.EXCEEDED');
    expect(code(() => h.mod.limits.check(ctxFor(member('acct_a')), input))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => h.mod.limits.check(ctxFor(system()), { ...input, used: -1 }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.mod.limits.check(ctxFor(system()), { ...input, kind: 'unlimited' as never }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => h.mod.limits.check(ctxFor(system()), { ...input, kind: 'auction_max_value', used: 0, requested: '10001' }))).toBe('LIMITS.EXCEEDED');
  });
});
