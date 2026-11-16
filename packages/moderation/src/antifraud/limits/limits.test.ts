import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRoleTableAuthz, defineCommand, ok, z, type Actor, type EventEnvelope } from '@classrup/kernel';
import { createTestKernel } from '@classrup/kernel/testing';
import {
  DEFAULT_THRESHOLDS, FLOW_LIMIT_KEYS, LIMITS_MODULE, LIMITS_ROLES, LIMIT_KEYS, TIER_TABLE, accountLimitRepo, computeEffective, computeTier, createRollingWindowCounter,
  expireOverrides, limitChangedEvent, limitsDefinitions, purgeSubjectLimits, tierSweep, weeklyOverrideReport, type AccountLimit, type FlowCounterPort, type LimitKey, type Tier,
} from './index.ts';

const DAY = 86_400_000;
const NOW = Date.parse('2026-11-04T10:00:00.000Z');
const A = 'did:key:z6MkKeyA';
const B = 'did:key:z6MkKeyB';
const C = 'did:key:z6MkKeyC';
const M1 = 'did:key:z6MkModeratorOne';
const M2 = 'did:key:z6MkModeratorTwo';
const member = (id: string): Actor => ({ kind: 'user', id, roles: ['member'] });
const moderator = (id: string): Actor => ({ kind: 'user', id, roles: ['moderator'] });
const operator: Actor = { kind: 'operator', id: 'did:key:z6MkOperator', roles: ['operator'] };

let seq = 0;
function envelope(tenantId: string, type: string, payload: unknown, occurredAt: string): EventEnvelope {
  seq += 1;
  return {
    eventId: `0192f400-0000-7000-8000-${String(seq).padStart(12, '0')}`, type, version: 1, tenantId, aggregate: { type: 'test', id: 'x' }, revision: 1,
    actor: { kind: 'system', id: 'test' }, occurredAt, correlationId: 'c1', causationId: 'c0', privacy: 'P2', payload, provenance: { origin: 'relay:x', sig: null },
  };
}

function setup(opts: { flow?: FlowCounterPort; flowFailMode?: (k: LimitKey) => 'open' | 'closed'; start?: string | number } = {}) {
  const defs = limitsDefinitions({ ...(opts.flow ? { flow: opts.flow } : {}), ...(opts.flowFailMode ? { flowFailMode: opts.flowFailMode } : {}) });
  const maintenance = defineCommand({
    name: 'limits.maintenance.run', module: LIMITS_MODULE, capability: 'limits.maintenance.run', idempotent: false,
    input: z.strictObject({ what: z.enum(['sweep', 'expire']), strict: z.boolean().default(false) }),
    handler: (ctx, input) => {
      const r = input.what === 'sweep' ? tierSweep(ctx, input.strict ? { established: { minAgeDays: 30, minDeals: 3 }, trusted: { minAgeDays: 400, minDeals: 10 } } : DEFAULT_THRESHOLDS) : expireOverrides(ctx);
      return r.ok ? ok(r.value) : r;
    },
  });
  const purge = defineCommand({
    name: 'limits.subject.purge', module: LIMITS_MODULE, capability: 'limits.maintenance.run', idempotent: false, input: z.strictObject({ subjectKey: z.string() }),
    handler: (ctx, input) => ok({ removed: purgeSubjectLimits(ctx.tx, input.subjectKey) }),
  });
  const k = createTestKernel({
    definitions: [...defs.all, maintenance, purge], start: opts.start ?? NOW,
    authz: createRoleTableAuthz({ ...LIMITS_ROLES, 'limits.maintenance.run': ['*', 'anonymous'] }),
  });
  const deliver = (consumer: string, type: string, payload: unknown) => k.outbox.deliver(consumer, envelope(k.tenantId, type, payload, k.clock.iso()));
  const created = (did: string) => deliver('moderation.limits_account', 'identity.account.created', { accountId: 'acc', did, pseudonym: 'p', createdAt: k.clock.iso() });
  const deal = (...dids: string[]) => deliver('moderation.limits_deal', 'commerce.deal.completed', { dealId: 'd', contextRef: { type: 'offer', id: 'o' }, completedAt: k.clock.iso(), parties: dids.map((did) => ({ did, role: 'party' })) });
  const risk = (did: string, level: 'low' | 'medium' | 'high') => deliver('moderation.limits_risk', 'moderation.risk.elevated', { assessmentId: 'a', subjectType: 'key', subjectRef: did, previousLevel: 'low', level, score: 50, frictions: [], modelVersion: '1' });
  const mine = async (did: string) => {
    const r = await k.ask('moderation.accountlimit.list_mine', { includeAdjustments: true }, { actor: member(did) });
    if (!r.ok) throw new Error(r.error.code);
    return (r.value.value as { items: { limitKey: LimitKey; tier: Tier; effectiveValue: number; used?: number; adjustments: { kind: string; reason: string }[]; nextTier?: { tier: string; minAgeDays: number; minDeals: number } }[] }).items;
  };
  const run = (what: 'sweep' | 'expire', strict = false) => k.cmd('limits.maintenance.run', { what, strict }, { actor: member('did:key:z6MkRoot') });
  const limitEvents = () => k.events.filter((e) => e.type === 'moderation.limit.changed');
  const countRows = async () => (await k.storage.read((tx) => tx.records.query({ tenant: k.tenantId, type: accountLimitRepo.type, filters: [], orderSlot: 0, dir: 'asc', limit: 500 }))).length;
  return { k, defs, deliver, created, deal, risk, mine, run, limitEvents, countRows };
}

/** Relay X fixtures: A first seen 2 days ago with no deals, B 40 days and 5 deals, C 120 days and 12 deals. */
async function fixtures() {
  const s = setup({ start: NOW - 120 * DAY });
  await s.created(C);
  s.k.clock.advance(80 * DAY);
  await s.created(B);
  s.k.clock.advance(38 * DAY);
  await s.created(A);
  for (let i = 0; i < 5; i++) await s.deal(B);
  for (let i = 0; i < 12; i++) await s.deal(C);
  s.k.clock.advance(2 * DAY);
  expect(s.k.clock.now()).toBe(NOW);
  return s;
}

describe('tier table and effective values', () => {
  it('TEST-PS-098-09.T01 derives the tier of keys A, B and C and answers the published value for all five limit keys', async () => {
    const s = await fixtures();
    const values = async (did: string) => (await s.mine(did)).map((i) => [i.tier, i.effectiveValue]);
    expect(await values(A)).toEqual([['new', 5], ['new', 10], ['new', 3], ['new', 20], ['new', 20]]);
    expect(await values(B)).toEqual([['established', 20], ['established', 50], ['established', 10], ['established', 100], ['established', 60]]);
    expect(await values(C)).toEqual([['trusted', 100], ['trusted', 200], ['trusted', 25], ['trusted', 500], ['trusted', 200]]);
    expect((await s.mine(A)).map((i) => i.limitKey)).toEqual([...LIMIT_KEYS]);
    // a key never seen on this relay starts as tier new
    expect((await s.mine('did:key:z6MkStranger')).every((i) => i.tier === 'new')).toBe(true);
    // the next tier requirements are shown to the member
    expect((await s.mine(A))[0]?.nextTier).toMatchObject({ tier: 'established', minAgeDays: 7, minDeals: 3 });
    expect((await s.mine(C))[0]?.nextTier).toBeUndefined();
    expect(computeTier(40 * DAY, 5)).toBe('established');
    expect(computeTier(400 * DAY, 2)).toBe('new');
    expect(computeTier(3 * DAY, 500)).toBe('new');
  });

  it('TEST-PS-098-09.T02 effective value follows the documented formula for random tiers, multipliers, overrides and restrictions', () => {
    const tiers = fc.constantFrom<Tier>('new', 'established', 'trusted');
    fc.assert(fc.property(
      tiers, fc.constantFrom(...LIMIT_KEYS), fc.constantFrom(1 as const, 0.75 as const, 0.5 as const),
      fc.option(fc.record({ value: fc.integer({ min: 0, max: 10_000 }), offsetMs: fc.integer({ min: -DAY, max: 90 * DAY }) }), { nil: undefined }),
      fc.option(fc.integer({ min: -DAY, max: DAY }), { nil: undefined }),
      (tier, limitKey, riskMultiplier, ov, restrictOffset) => {
        const baseValue = TIER_TABLE[tier][limitKey];
        const d = {
          baseValue, riskMultiplier,
          ...(ov ? { overrideValue: ov.value, overrideExpiresAt: new Date(NOW + ov.offsetMs).toISOString() } : {}),
          ...(restrictOffset !== undefined ? { restrictedUntil: new Date(NOW + restrictOffset).toISOString() } : {}),
        };
        const got = computeEffective(d, NOW);
        const restricted = restrictOffset !== undefined && restrictOffset > 0;
        const overridden = ov !== undefined && ov.offsetMs > 0;
        const expected = restricted ? 0 : overridden ? ov.value : Math.max(1, Math.floor(baseValue * riskMultiplier));
        expect(got).toBe(expected);
        if (!restricted && !overridden) expect(got).toBeGreaterThanOrEqual(1);
        if (!restricted && !overridden) expect(got).toBeLessThanOrEqual(baseValue);
      },
    ), { numRuns: 300 });
    expect(computeEffective({ baseValue: 0, riskMultiplier: 0.5 }, NOW)).toBe(0);
  });

  it('every tier value is monotone from new to trusted for each limit key', () => {
    for (const key of LIMIT_KEYS) {
      expect(TIER_TABLE.new[key]).toBeLessThan(TIER_TABLE.established[key]);
      expect(TIER_TABLE.established[key]).toBeLessThan(TIER_TABLE.trusted[key]);
    }
  });
});

describe('override and clear commands', () => {
  const ov = { subjectKey: A, limitKey: 'listings_per_day', overrideValue: 30, reason: 'Verified shop selling stock', expiresInMs: 30 * DAY } as const;

  it('TEST-PS-098-09.T03 refuses value 10001, a short reason, an expiry of 91 days and an override on the moderator own key, storing nothing', async () => {
    const s = setup();
    const call = async (input: unknown, actor: Actor) => {
      const r = await s.k.cmd('moderation.accountlimit.override', input, { actor });
      return r.ok ? 'ok' : r.error.code;
    };
    expect(await call({ ...ov, overrideValue: 10_001 }, moderator(M1))).toBe('VALIDATION_FAILED');
    expect(await call({ ...ov, reason: 'too short' }, moderator(M1))).toBe('VALIDATION_FAILED');
    expect(await call({ ...ov, expiresInMs: 91 * DAY }, moderator(M1))).toBe('VALIDATION_FAILED');
    expect(await call({ ...ov, subjectKey: M1 }, moderator(M1))).toBe('FORBIDDEN');
    expect(await call({ ...ov, expiresInMs: 1000 }, moderator(M1))).toBe('VALIDATION_FAILED');
    expect(await call({ ...ov, limitKey: 'bids_per_hour' }, moderator(M1))).toBe('VALIDATION_FAILED');
    expect(await call({ ...ov, overrideValue: 1.5 }, moderator(M1))).toBe('VALIDATION_FAILED');
    expect(await call({ ...ov, reason: 'x'.repeat(501) }, moderator(M1))).toBe('VALIDATION_FAILED');
    expect(await call({ ...ov, extra: true }, moderator(M1))).toBe('VALIDATION_FAILED');
    expect(await s.countRows()).toBe(0);
    expect(s.limitEvents()).toHaveLength(0);
  });

  it('applies an override with reason and expiry, shows it to the member without the moderator identity, and clears it', async () => {
    const s = setup();
    const set = await s.k.cmd('moderation.accountlimit.override', ov, { actor: moderator(M1) });
    expect(set.ok).toBe(true);
    if (!set.ok) return;
    const out = set.value.value as { accountLimitId: string; effectiveValue: number; revision: number };
    expect(out.effectiveValue).toBe(30);
    const listings = (await s.mine(A))[0];
    expect(listings).toMatchObject({ effectiveValue: 30 });
    expect(listings?.adjustments.map((a) => a.kind)).toEqual(['tier', 'override']);
    expect(JSON.stringify(listings)).not.toContain(M1);
    expect(listings?.adjustments.find((a) => a.kind === 'override')?.reason).toBe(ov.reason);
    const stale = await s.k.cmd('moderation.accountlimit.clear_override', { accountLimitId: out.accountLimitId, expectedRevision: out.revision + 5 }, { actor: moderator(M2) });
    expect(stale.ok ? 'ok' : stale.error.code).toBe('CONFLICT_REVISION');
    const own = await s.k.cmd('moderation.accountlimit.clear_override', { accountLimitId: out.accountLimitId, expectedRevision: out.revision }, { actor: moderator(A) });
    expect(own.ok ? 'ok' : own.error.code).toBe('FORBIDDEN');
    const cleared = await s.k.cmd('moderation.accountlimit.clear_override', { accountLimitId: out.accountLimitId, expectedRevision: out.revision }, { actor: moderator(M2) });
    expect(cleared.ok && cleared.value.value).toMatchObject({ effectiveValue: 5, revision: out.revision + 1 });
    const again = await s.k.cmd('moderation.accountlimit.clear_override', { accountLimitId: out.accountLimitId, expectedRevision: out.revision + 1 }, { actor: moderator(M2) });
    expect(again.ok ? 'ok' : again.error.code).toBe('NOT_FOUND');
    const missing = await s.k.cmd('moderation.accountlimit.clear_override', { accountLimitId: 'nope', expectedRevision: 1 }, { actor: moderator(M2) });
    expect(missing.ok ? 'ok' : missing.error.code).toBe('NOT_FOUND');
    expect(s.limitEvents().map((e) => (e.payload as { cause: string; effectiveValue: number }).effectiveValue)).toEqual([30, 5]);
  });

  it('refuses a stale expectedRevision on override', async () => {
    const s = setup();
    expect((await s.k.cmd('moderation.accountlimit.override', ov, { actor: moderator(M1) })).ok).toBe(true);
    const stale = await s.k.cmd('moderation.accountlimit.override', { ...ov, overrideValue: 40, expectedRevision: 1 }, { actor: moderator(M1) });
    expect(stale.ok ? 'ok' : stale.error.code).toBe('CONFLICT_REVISION');
    const fresh = await s.k.cmd('moderation.accountlimit.override', { ...ov, overrideValue: 40, expectedRevision: 2 }, { actor: moderator(M1) });
    expect(fresh.ok && fresh.value.value).toMatchObject({ effectiveValue: 40, revision: 3 });
  });

  it('a lowered limit keeps existing items and refuses new ones until the count drops', async () => {
    const s = setup();
    expect((await s.k.cmd('moderation.accountlimit.override', { ...ov, limitKey: 'open_offers', overrideValue: 2 }, { actor: moderator(M1) })).ok).toBe(true);
    const over = await s.k.ask('moderation.accountlimit.check', { subjectKey: A, limitKey: 'open_offers', currentCount: 7 }, { actor: operator });
    expect(over.ok ? 'ok' : over.error.code).toBe('ACCOUNT_LIMIT_REACHED');
    const under = await s.k.ask('moderation.accountlimit.check', { subjectKey: A, limitKey: 'open_offers', currentCount: 1 }, { actor: operator });
    expect(under.ok).toBe(true);
  });
});

describe('check and flow counters', () => {
  it('TEST-PS-098-09.T07 refuses the sixth listing of a day with resetsAt, and a stock limit at 10 of 10 without resetsAt', async () => {
    const s = setup();
    const check = (limitKey: string, extra: object = {}) => s.k.ask('moderation.accountlimit.check', { subjectKey: A, limitKey, ...extra }, { actor: operator });
    for (let i = 1; i <= 5; i++) {
      const r = await check('listings_per_day');
      expect(r.ok && r.value.value).toMatchObject({ allowed: true, effectiveValue: 5, used: i });
      s.k.clock.advance(1000);
    }
    const sixth = await check('listings_per_day');
    expect(sixth.ok).toBe(false);
    if (!sixth.ok) {
      expect(sixth.error.code).toBe('ACCOUNT_LIMIT_REACHED');
      expect(sixth.error.status).toBe(429);
      expect(sixth.error.retryable).toBe(false);
      expect(sixth.error.params).toMatchObject({ limitKey: 'listings_per_day', effectiveValue: 5, used: 5, resetsAt: new Date(NOW + DAY).toISOString() });
      expect((sixth.error.params as { reasons: string[] }).reasons).toEqual(['tier new: 5 per day; becomes 20 after 7 days and 3 completed deals']);
    }
    // the window rolls: after the first unit expires one slot is free again
    s.k.clock.advance(DAY - 5000);
    expect((await check('listings_per_day')).ok).toBe(true);
    const stock = await check('open_offers', { currentCount: 10 });
    expect(stock.ok).toBe(false);
    if (!stock.ok) {
      expect(stock.error.code).toBe('ACCOUNT_LIMIT_REACHED');
      expect(stock.error.params).toMatchObject({ limitKey: 'open_offers', effectiveValue: 10, used: 10 });
      expect(stock.error.params).not.toHaveProperty('resetsAt');
    }
    expect((await check('open_offers', { currentCount: 9 })).ok).toBe(true);
    const missing = await check('open_offers');
    expect(missing.ok ? 'ok' : missing.error.code).toBe('VALIDATION_FAILED');
    const negative = await check('open_offers', { currentCount: -1 });
    expect(negative.ok ? 'ok' : negative.error.code).toBe('VALIDATION_FAILED');
    const unknown = await check('mystery_limit', { currentCount: 0 });
    expect(unknown.ok ? 'ok' : unknown.error.code).toBe('VALIDATION_FAILED');
  });

  it('checks never mutate stock-limit state and do not create rows', async () => {
    const s = setup();
    await s.k.ask('moderation.accountlimit.check', { subjectKey: A, limitKey: 'open_offers', currentCount: 0 }, { actor: operator });
    expect(await s.countRows()).toBe(0);
    expect(FLOW_LIMIT_KEYS.has('open_offers')).toBe(false);
  });

  it('TEST-PS-098-09.T09 replays a repeated Idempotency-Key and applies the class fail mode when the flow counter is down', async () => {
    const s = setup();
    const key = s.k.ids.next();
    const ov = { subjectKey: A, limitKey: 'listings_per_day', overrideValue: 30, reason: 'Verified shop selling stock', expiresInMs: 30 * DAY };
    const first = await s.k.cmd('moderation.accountlimit.override', ov, { actor: moderator(M1), idempotencyKey: key });
    const second = await s.k.cmd('moderation.accountlimit.override', ov, { actor: moderator(M1), idempotencyKey: key });
    expect(first.ok && second.ok && second.value.replayed).toBe(true);
    expect(first.ok && second.ok && second.value.value).toEqual(first.ok ? first.value.value : null);
    expect(s.limitEvents()).toHaveLength(1);
    const reused = await s.k.cmd('moderation.accountlimit.override', { ...ov, overrideValue: 31 }, { actor: moderator(M1), idempotencyKey: key });
    expect(reused.ok ? 'ok' : reused.error.code).toBe('IDEMPOTENCY_KEY_REUSED');

    const down: FlowCounterPort = { consume: () => { throw new Error('rate store unavailable'); } };
    const open = setup({ flow: down });
    const allowed = await open.k.ask('moderation.accountlimit.check', { subjectKey: A, limitKey: 'listings_per_day' }, { actor: operator });
    expect(allowed.ok && allowed.value.value).toMatchObject({ allowed: true, effectiveValue: 5 });
    const closed = setup({ flow: down, flowFailMode: () => 'closed' });
    const refused = await closed.k.ask('moderation.accountlimit.check', { subjectKey: A, limitKey: 'listings_per_day' }, { actor: operator });
    expect(refused.ok ? 'ok' : refused.error.code).toBe('DEPENDENCY_UNAVAILABLE');
    // stock limits rely on caller-supplied counts and never touch the counter
    const stock = await closed.k.ask('moderation.accountlimit.check', { subjectKey: A, limitKey: 'open_offers', currentCount: 3 }, { actor: operator });
    expect(stock.ok).toBe(true);
  });

  it('the rolling window counter is deterministic and gives the time the oldest unit frees', () => {
    const clock = { t: NOW, now() { return this.t; }, iso() { return new Date(this.t).toISOString(); } };
    const c = createRollingWindowCounter(clock);
    const input = { tenantId: 't', counter: 'x', subject: 's', limit: 2, windowMs: 1000 };
    expect(c.consume(input, 1)).toMatchObject({ allowed: true, used: 1 });
    clock.t += 300;
    expect(c.consume(input, 1)).toMatchObject({ allowed: true, used: 2 });
    expect(c.consume(input, 1)).toEqual({ allowed: false, used: 2, resetsAt: new Date(NOW + 1000).toISOString() });
    expect(c.consume(input, 2)).toMatchObject({ allowed: false, resetsAt: new Date(NOW + 1300).toISOString() });
    clock.t += 700;
    expect(c.consume(input, 1)).toMatchObject({ allowed: true, used: 2 });
    expect(c.peek?.(input)).toMatchObject({ used: 2 });
    expect(c.consume({ ...input, counter: 'y', limit: 0 }, 1)).toEqual({ allowed: false, used: 0 });
  });
});

describe('events, sweeps and expiry', () => {
  it('TEST-PS-098-09.T04 promotes a tier only when age and completed deals both hold, and emits limit.changed when an override expires', async () => {
    const s = setup();
    await s.created(A);
    await s.deal(A, B);
    await s.deal(A);
    await s.deal(A);
    // three deals but only a day old: still new, no event
    s.k.clock.advance(DAY);
    expect((await s.run('sweep')).ok).toBe(true);
    expect((await s.mine(A)).every((i) => i.tier === 'new')).toBe(true);
    expect(s.limitEvents()).toHaveLength(0);
    // seven days of age without the deals does not promote key B
    s.k.clock.advance(6 * DAY);
    expect((await s.run('sweep')).ok).toBe(true);
    expect((await s.mine(A)).map((i) => i.tier)).toEqual(Array(5).fill('established'));
    expect((await s.mine(B)).every((i) => i.tier === 'new')).toBe(true);
    const tierEvents = s.limitEvents().filter((e) => (e.payload as { cause: string }).cause === 'tier');
    expect(tierEvents).toHaveLength(5);
    expect(tierEvents.map((e) => (e.payload as { effectiveValue: number }).effectiveValue).sort((x, y) => x - y)).toEqual([10, 20, 50, 60, 100]);
    // an override expiring emits override_expired and restores the base value
    const set = await s.k.cmd('moderation.accountlimit.override', { subjectKey: A, limitKey: 'listings_per_day', overrideValue: 30, reason: 'Verified shop selling stock', expiresInMs: DAY }, { actor: moderator(M1) });
    expect(set.ok).toBe(true);
    const before = s.limitEvents().length;
    s.k.clock.advance(DAY - 1);
    expect((await s.run('expire')).ok).toBe(true);
    expect(s.limitEvents()).toHaveLength(before);
    s.k.clock.advance(1);
    const expired = await s.run('expire');
    expect(expired.ok && expired.value.value).toEqual({ changed: 1 });
    const last = s.limitEvents().at(-1)?.payload as { cause: string; previousValue: number; effectiveValue: number };
    expect(last).toMatchObject({ cause: 'override_expired', previousValue: 30, effectiveValue: 20 });
    expect((await s.mine(A))[0]).toMatchObject({ effectiveValue: 20 });
    // nothing left to expire
    expect((await s.run('expire')).ok && true).toBe(true);
    expect(s.limitEvents().at(-1)?.payload).toEqual(last);
  });

  it('a key never loses more than one tier per sweep and the first-seen record is not overwritten', async () => {
    const s = await fixtures();
    await s.created(C);
    expect((await s.mine(C)).every((i) => i.tier === 'trusted')).toBe(true);
    // stricter thresholds would put C in new; the sweep demotes one tier only
    expect((await s.run('sweep', true)).ok).toBe(true);
    expect((await s.mine(C)).every((i) => i.tier === 'established')).toBe(true);
    expect((await s.run('sweep', true)).ok).toBe(true);
    expect((await s.mine(C)).every((i) => i.tier === 'established')).toBe(true);
  });

  it('TEST-PS-098-09.T05 follows risk medium, high and recovery with one event per distinct effective value', async () => {
    const s = await fixtures();
    const listing = () => s.limitEvents().filter((e) => (e.payload as { limitKey: string; subjectKey: string }).limitKey === 'listings_per_day' && (e.payload as { subjectKey: string }).subjectKey === B && (e.payload as { cause: string }).cause === 'risk');
    const eff = async () => (await s.mine(B))[0]?.effectiveValue;
    expect(await eff()).toBe(20);
    await s.risk(B, 'medium');
    expect(await eff()).toBe(15);
    await s.risk(B, 'medium');
    expect(listing()).toHaveLength(1);
    await s.risk(B, 'high');
    expect(await eff()).toBe(10);
    expect((await s.mine(B))[0]?.adjustments.map((a) => a.kind)).toEqual(['tier', 'risk']);
    await s.risk(B, 'low');
    expect(await eff()).toBe(20);
    const payloads = listing().map((e) => e.payload as { previousValue: number; effectiveValue: number; cause: string });
    expect(payloads).toEqual([
      expect.objectContaining({ previousValue: 20, effectiveValue: 15, cause: 'risk' }),
      expect.objectContaining({ previousValue: 15, effectiveValue: 10, cause: 'risk' }),
      expect.objectContaining({ previousValue: 10, effectiveValue: 20, cause: 'risk' }),
    ]);
    // the multiplier never drops a positive base below 1
    await s.risk(A, 'high');
    expect((await s.mine(A)).map((i) => i.effectiveValue)).toEqual([2, 5, 1, 10, 10]);
    // events about transactions or malformed subjects are ignored
    expect(await s.deliver('moderation.limits_risk', 'moderation.risk.elevated', { subjectType: 'transaction', subjectRef: A, level: 'low' })).toBe('delivered');
    expect((await s.mine(A))[0]?.effectiveValue).toBe(2);
  });

  it('a restrict_feature action naming a limit key sets the value to 0 for the action duration and the sweep restores it', async () => {
    const s = setup();
    const until = new Date(NOW + 3 * DAY).toISOString();
    await s.deliver('moderation.limits_action', 'moderation.action.applied', { actionId: 'act1', caseId: 'c', kind: 'restrict_feature', subjectKey: A, ruleRefs: [], expiresAt: until, limitKey: 'bids_per_day' });
    expect((await s.mine(A)).map((i) => i.effectiveValue)).toEqual([5, 10, 3, 0, 20]);
    const denied = await s.k.ask('moderation.accountlimit.check', { subjectKey: A, limitKey: 'bids_per_day' }, { actor: operator });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.params).toMatchObject({ effectiveValue: 0, resetsAt: until });
    // other action kinds and past expiries are ignored
    await s.deliver('moderation.limits_action', 'moderation.action.applied', { kind: 'warn', subjectKey: B, limitKey: 'bids_per_day', expiresAt: until });
    await s.deliver('moderation.limits_action', 'moderation.action.applied', { kind: 'restrict_feature', subjectKey: B, limitKey: 'bids_per_day', expiresAt: new Date(NOW - 1).toISOString() });
    expect(await s.countRows()).toBe(5);
    s.k.clock.advance(3 * DAY);
    expect((await s.mine(A))[3]?.effectiveValue).toBe(20);
    expect((await s.run('expire')).ok).toBe(true);
    expect(s.limitEvents().at(-1)?.payload).toMatchObject({ limitKey: 'bids_per_day', previousValue: 0, effectiveValue: 20, cause: 'policy' });
  });

  it('deal completion counts both parties once per event and caps completedDeals at 1000', async () => {
    const s = setup();
    const env = { dealId: 'd', parties: [{ did: A, role: 'buyer' }, { did: B, role: 'seller' }, { did: 'not-a-did', role: 'x' }] };
    const event = envelope(s.k.tenantId, 'commerce.deal.completed', env, s.k.clock.iso());
    expect(await s.k.outbox.deliver('moderation.limits_deal', event)).toBe('delivered');
    expect(await s.k.outbox.deliver('moderation.limits_deal', event)).toBe('duplicate');
    const rows = await s.k.storage.read((tx) => tx.records.query<AccountLimit>({ tenant: s.k.tenantId, type: accountLimitRepo.type, filters: [], orderSlot: 0, dir: 'asc', limit: 100 }));
    expect(rows).toHaveLength(10);
    expect(rows.every((r) => r.data.completedDeals === 1)).toBe(true);
  });

  it('purges every row of a deleted membership and nothing else', async () => {
    const s = setup();
    await s.created(A);
    await s.created(B);
    const removed = await s.k.cmd('limits.subject.purge', { subjectKey: A }, { actor: member(M1) });
    expect(removed.ok && removed.value.value).toEqual({ removed: 5 });
    expect(await s.countRows()).toBe(5);
  });
});

describe('contracts and abuse', () => {
  it('TEST-PS-098-09.T06 definitions carry the spec names, capabilities and module, and the event payload validates against its schema', async () => {
    const s = setup();
    expect(s.defs.all.map((d) => d.name)).toEqual([
      'moderation.accountlimit.check', 'moderation.accountlimit.override', 'moderation.accountlimit.clear_override', 'moderation.accountlimit.list_mine',
      'moderation.limits_risk', 'moderation.limits_deal', 'moderation.limits_account', 'moderation.limits_action',
    ]);
    for (const d of s.defs.all) expect(d.module).toBe('F12.S03.M04');
    expect([s.defs.check.capability, s.defs.override.capability, s.defs.clearOverride.capability, s.defs.listMine.capability]).toEqual([
      'moderation.accountlimit.check', 'moderation.accountlimit.override', 'moderation.accountlimit.clear_override', 'moderation.accountlimit.read_own',
    ]);
    expect(s.defs.check.surface).toBe('vault');
    expect(s.defs.override.idempotent && s.defs.clearOverride.idempotent).toBe(true);
    const ok1 = await s.k.cmd('moderation.accountlimit.override', { subjectKey: A, limitKey: 'listings_per_day', overrideValue: 30, reason: 'Verified shop selling stock', expiresInMs: 30 * DAY }, { actor: moderator(M1) });
    expect(ok1.ok).toBe(true);
    const event = s.limitEvents()[0];
    expect(event?.type).toBe('moderation.limit.changed');
    expect(limitChangedEvent.payload.safeParse(event?.payload).success).toBe(true);
    expect(event?.payload).toEqual({ accountLimitId: expect.any(String), subjectKey: A, limitKey: 'listings_per_day', previousValue: 5, effectiveValue: 30, cause: 'override' });
    expect(limitChangedEvent.payload.safeParse({ ...(event?.payload as object), cause: 'whim' }).success).toBe(false);
    // check output of an allowed request matches the documented shape
    const checked = await s.k.ask('moderation.accountlimit.check', { subjectKey: A, limitKey: 'listings_per_day' }, { actor: operator });
    expect(checked.ok && checked.value.value).toMatchObject({ allowed: true, effectiveValue: 30, used: 1, reasons: expect.any(Array) });
    expect(JSON.stringify(checked.ok ? checked.value.value : '')).not.toContain(M1);
  });

  it('TEST-PS-098-09.T08 a member cannot override a limit, the check is not reachable over HTTP, and a moderator cannot override their own key', async () => {
    const s = setup();
    const own = await s.k.cmd('moderation.accountlimit.override', { subjectKey: A, limitKey: 'listings_per_day', overrideValue: 500, reason: 'give myself more room', expiresInMs: DAY }, { actor: member(A) });
    expect(own.ok ? 'ok' : own.error.code).toBe('FORBIDDEN');
    const http = await s.k.bus.query({ actor: member(A), tenantId: s.k.tenantId, origin: 'remote' }, 'moderation.accountlimit.check', { subjectKey: B, limitKey: 'listings_per_day' });
    expect(http.ok ? 'ok' : http.error.code).toBe('NOT_FOUND');
    const direct = await s.k.ask('moderation.accountlimit.check', { subjectKey: B, limitKey: 'listings_per_day' }, { actor: member(A) });
    expect(direct.ok ? 'ok' : direct.error.code).toBe('FORBIDDEN');
    const self = await s.k.cmd('moderation.accountlimit.override', { subjectKey: M1, limitKey: 'listings_per_day', overrideValue: 500, reason: 'give myself more room', expiresInMs: DAY }, { actor: moderator(M1) });
    expect(self.ok ? 'ok' : self.error.code).toBe('FORBIDDEN');
    // members read only their own limits: the query takes no subject and reflects the caller
    await s.created(B);
    expect((await s.mine(A)).every((i) => i.tier === 'new')).toBe(true);
    expect(await s.countRows()).toBe(5);
  });

  it('TEST-PS-098-09.T10 refuses the 31st override of a moderator in a day with RATE_LIMITED, and the weekly report lists all attempts', async () => {
    const s = setup();
    let last: Awaited<ReturnType<typeof s.k.cmd>> | undefined;
    for (let i = 0; i < 31; i++) {
      last = await s.k.cmd('moderation.accountlimit.override', { subjectKey: `did:key:z6MkSubject${i}`, limitKey: 'open_offers', overrideValue: 12, reason: 'Trusted seller review', expiresInMs: DAY }, { actor: moderator(M1) });
      if (i < 30) expect(last.ok).toBe(true);
    }
    expect(last && !last.ok && last.error.code).toBe('RATE_LIMITED');
    expect(last && !last.ok && typeof last.error.retryAfterMs).toBe('number');
    // another moderator is unaffected
    expect((await s.k.cmd('moderation.accountlimit.override', { subjectKey: A, limitKey: 'open_offers', overrideValue: 12, reason: 'Trusted seller review', expiresInMs: DAY }, { actor: moderator(M2) })).ok).toBe(true);
    const report = weeklyOverrideReport(s.k.audit, s.k.clock.now());
    expect(report).toEqual([
      { moderator: M1, attempts: 31, applied: 30, refused: 1 },
      { moderator: M2, attempts: 1, applied: 1, refused: 0 },
    ]);
    // the next day the cap is open again
    s.k.clock.advance(DAY + 1);
    expect((await s.k.cmd('moderation.accountlimit.override', { subjectKey: 'did:key:z6MkSubject99', limitKey: 'open_offers', overrideValue: 12, reason: 'Trusted seller review', expiresInMs: DAY }, { actor: moderator(M1) })).ok).toBe(true);
    // entries older than a week are not in the report
    s.k.clock.advance(8 * DAY);
    expect(weeklyOverrideReport(s.k.audit, s.k.clock.now())).toEqual([]);
  });
});
