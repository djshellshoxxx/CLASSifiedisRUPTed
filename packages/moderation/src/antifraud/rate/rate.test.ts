import { createHmac } from 'node:crypto';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createFakeClock, createRingBufferSink, createLogger, createRoleTableAuthz, defineCommand, ok, z, type EventEnvelope, type RateQuery } from '@classrup/kernel';
import { createTestKernel } from '@classrup/kernel/testing';
import { gcraConsume, tokenConsume, type TokenState } from './engine.ts';
import {
  BUILTIN_POLICIES, RATE_ROLES, createMemoryCounterStore, createRateLimiter, normalizePrefix, rateDefinitions, rateExceededEvent, ratePolicyRepo,
  type BucketState, type CounterStore, type RateExceededNotice, type RateOptions,
} from './index.ts';

const TENANT = '0192f400-0000-7000-8000-000000000001';
const START = '2026-11-04T10:00:00.000Z';
const hmac = (salt: string, message: string) => createHmac('sha256', salt).update(message).digest('hex');

function limiterSetup(extra: Partial<RateOptions> = {}) {
  const clock = createFakeClock(START);
  const notices: RateExceededNotice[] = [];
  const destroyed: number[] = [];
  const saltCalls: number[] = [];
  const logs = createRingBufferSink(1000);
  const logger = createLogger({ sink: logs.sink, clock, level: 'debug' });
  const limiter = createRateLimiter({
    clock, keyedHash: hmac, logger, onExceeded: (n) => notices.push(n),
    salt: (day) => { saltCalls.push(day); return `salt-${day}`; }, destroySalt: (day) => destroyed.push(day), ...extra,
  });
  return { clock, limiter, notices, destroyed, saltCalls, logs };
}
const query = (over: Partial<RateQuery> = {}): RateQuery => ({
  tenantId: TENANT, actor: { kind: 'user', id: 'did:key:z6MkAlice', roles: ['member'] }, operation: 'bazaar.offer.make', capability: 'bazaar.offer.make', kind: 'command', now: 0, ...over,
});
const offer = (n: number): RateQuery => query({ actor: { kind: 'user', id: `did:key:z6MkUser${n}`, roles: ['member'] } });

describe('GCRA and token bucket engine', () => {
  it('TEST-PS-099-09.T01 GCRA 20 per hour with burst 5 allows five immediate calls then denies with the remaining interval', () => {
    const params = { ratePerMinute: 20 / 60, burst: 5 }; // 20 per hour: one emission interval of 3 minutes
    let tat: number | undefined;
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) {
      const r = gcraConsume(tat, t0, params);
      expect(r.allowed).toBe(true);
      tat = r.tat;
    }
    const sixth = gcraConsume(tat, t0, params);
    expect(sixth.allowed).toBe(false);
    if (!sixth.allowed) expect(sixth.retryAfterMs).toBe(180_000);
    const later = gcraConsume(tat, t0 + 45_000, params);
    expect(later.allowed).toBe(false);
    if (!later.allowed) expect(later.retryAfterMs).toBe(180_000 - 45_000);
    expect(gcraConsume(tat, t0 + 180_000, params).allowed).toBe(true);
    // the denied call did not move the arrival time
    expect(sixth.tat).toBe(tat);
  });

  it('TEST-PS-099-09.T01 through the port: the sixth call of a burst of five is denied with retryAfterMs equal to one interval minus elapsed time', () => {
    const { limiter, clock } = limiterSetup();
    limiter.applyPolicy(TENANT, { capabilityClass: 'write.offer', algorithm: 'gcra', ratePerMinute: 1, burst: 5, prefixMultiplier: 20, failMode: 'open' });
    for (let i = 0; i < 5; i++) expect(limiter.check(query())).toEqual({ allowed: true });
    expect(limiter.check(query())).toEqual({ allowed: false, retryAfterMs: 60_000 });
    clock.advance(25_000);
    expect(limiter.check(query())).toEqual({ allowed: false, retryAfterMs: 35_000 });
    clock.advance(35_000);
    expect(limiter.check(query())).toEqual({ allowed: true });
  });

  it('TEST-PS-099-09.T02 matches exact reference models for random arrival sequences; tokens stay in [0, capacity] and tat never moves backward', () => {
    const arrivals = fc.array(fc.integer({ min: 0, max: 400_000 }), { minLength: 1, maxLength: 60 });
    fc.assert(fc.property(fc.integer({ min: 1, max: 6000 }), fc.integer({ min: 1, max: 40 }), arrivals, (rate, burst, gaps) => {
      // Reference GCRA as a leaky bucket meter in exact integer ticks (1 tick = 1/rate ms; one request = 60000 ticks).
      let level = 0;
      let tat: number | undefined;
      // Reference token bucket in exact micro-tokens (one token = 60000 units; refill = rate units per ms).
      let units = burst * 60_000;
      let state: TokenState | undefined;
      let now = 0;
      let lastTat = -Infinity;
      for (const gap of gaps) {
        now += gap;
        level = Math.max(0, level - gap * rate);
        const refAllowed = level + 60_000 <= burst * 60_000;
        if (refAllowed) level += 60_000;
        const g = gcraConsume(tat, now, { ratePerMinute: rate, burst });
        expect(g.allowed).toBe(refAllowed);
        if (!g.allowed) {
          const exactWaitMs = Math.ceil((level + 60_000 - burst * 60_000) / rate);
          expect(g.retryAfterMs).toBe(exactWaitMs);
        }
        expect(g.tat).toBeGreaterThanOrEqual(lastTat);
        lastTat = g.tat;
        tat = g.tat;

        units = Math.min(burst * 60_000, units + gap * rate);
        const refTokenAllowed = units >= 60_000;
        if (refTokenAllowed) units -= 60_000;
        const tk = tokenConsume(state, now, { ratePerMinute: rate, burst });
        expect(tk.allowed).toBe(refTokenAllowed);
        expect(tk.state.tokens).toBeGreaterThanOrEqual(0);
        expect(tk.state.tokens).toBeLessThanOrEqual(burst);
        expect(Math.abs(tk.state.tokens - units / 60_000)).toBeLessThan(1e-6);
        state = tk.state;
      }
    }), { numRuns: 200 });
  });

  it('TEST-PS-099-09.T02 a denied call becomes allowed exactly after retryAfterMs and not one millisecond earlier', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 6000 }), fc.integer({ min: 1, max: 30 }), fc.boolean(), (rate, burst, useGcra) => {
      const params = { ratePerMinute: rate, burst };
      let tat: number | undefined;
      let tok: TokenState | undefined;
      for (let i = 0; i < burst; i++) {
        if (useGcra) tat = gcraConsume(tat, 0, params).tat;
        else tok = tokenConsume(tok, 0, params).state;
      }
      const denied = useGcra ? gcraConsume(tat, 0, params) : tokenConsume(tok, 0, params);
      expect(denied.allowed).toBe(false);
      if (denied.allowed) return;
      const wait = denied.retryAfterMs;
      const at = (t: number) => (useGcra ? gcraConsume(tat, t, params) : tokenConsume(tok, t, params));
      expect(at(wait).allowed).toBe(true);
      expect(at(wait - 1).allowed).toBe(false);
    }), { numRuns: 100 });
  });

  it('TEST-PS-099-09.T02 concurrent requests never exceed burst plus rate times elapsed time', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 600 }), fc.integer({ min: 1, max: 50 }), fc.array(fc.integer({ min: 0, max: 5000 }), { minLength: 1, maxLength: 200 }), (rate, burst, gaps) => {
      let tat: number | undefined;
      let now = 0;
      let allowed = 0;
      for (const gap of gaps) {
        now += gap;
        const r = gcraConsume(tat, now, { ratePerMinute: rate, burst });
        tat = r.tat;
        if (r.allowed) allowed += 1;
        expect(allowed).toBeLessThanOrEqual(burst + (rate * now) / 60_000 + 1e-6);
      }
    }), { numRuns: 100 });
  });
});

describe('policy command, validation and authorization', () => {
  function kernel() {
    const { limiter, clock } = limiterSetup();
    const defs = rateDefinitions({ limiter });
    const k = createTestKernel({ definitions: defs.all, authz: createRoleTableAuthz(RATE_ROLES), start: START });
    const operator = k.user(['operator']);
    return { k, limiter, defs, operator, clock };
  }
  const good = { capabilityClass: 'write.offer', algorithm: 'gcra', ratePerMinute: 10, burst: 30 } as const;

  it('TEST-PS-099-09.T03 rate 0, burst 2000 and fail-open relay.access are refused with the documented codes and store nothing', async () => {
    const { k, operator } = kernel();
    const zero = await k.cmd('moderation.ratepolicy.set', { ...good, ratePerMinute: 0 }, { actor: operator });
    const big = await k.cmd('moderation.ratepolicy.set', { ...good, burst: 2000 }, { actor: operator });
    const open = await k.cmd('moderation.ratepolicy.set', { capabilityClass: 'relay.access', algorithm: 'gcra', ratePerMinute: 5, burst: 5, failMode: 'open' }, { actor: operator });
    expect(zero.ok ? 'ok' : zero.error.code).toBe('VALIDATION_FAILED');
    expect(big.ok ? 'ok' : big.error.code).toBe('VALIDATION_FAILED');
    expect(open.ok ? 'ok' : open.error.code).toBe('RATE_POLICY_FAIL_MODE_LOCKED');
    const listed = await k.ask('moderation.ratepolicy.list', {}, { actor: operator });
    expect(listed.ok && (listed.value.value as { items: unknown[] }).items).toEqual([]);
  });

  it('refuses a GCRA burst above five times the rate, an unregistered class and an expectedRevision on create; locked classes default to closed', async () => {
    const { k, operator } = kernel();
    const expectCode = async (input: unknown, code: string) => {
      const r = await k.cmd('moderation.ratepolicy.set', input, { actor: operator });
      expect(r.ok ? 'ok' : r.error.code).toBe(code);
    };
    await expectCode({ ...good, ratePerMinute: 2, burst: 11 }, 'VALIDATION_FAILED');
    await expectCode({ ...good, capabilityClass: 'made.up' }, 'VALIDATION_FAILED');
    await expectCode({ ...good, prefixMultiplier: 21 }, 'VALIDATION_FAILED');
    await expectCode({ ...good, expectedRevision: 3 }, 'CONFLICT_REVISION');
    await expectCode({ ...good, unknown: 1 }, 'VALIDATION_FAILED');
    const locked = await k.cmd('moderation.ratepolicy.set', { capabilityClass: 'key.register', algorithm: 'gcra', ratePerMinute: 2, burst: 2 }, { actor: operator });
    expect(locked.ok).toBe(true);
    const listed = await k.ask('moderation.ratepolicy.list', {}, { actor: operator });
    expect(listed.ok && (listed.value.value as { items: { failMode: string }[] }).items[0]?.failMode).toBe('closed');
  });

  it('sets, revises with expectedRevision and replays by idempotency key', async () => {
    const { k, operator, limiter } = kernel();
    const key = k.ids.next();
    const first = await k.cmd('moderation.ratepolicy.set', good, { actor: operator, idempotencyKey: key });
    expect(first.ok && first.value.value).toMatchObject({ revision: 1 });
    const replay = await k.cmd('moderation.ratepolicy.set', good, { actor: operator, idempotencyKey: key });
    expect(replay.ok && replay.value.replayed).toBe(true);
    const stale = await k.cmd('moderation.ratepolicy.set', { ...good, burst: 40, expectedRevision: 5 }, { actor: operator });
    expect(stale.ok ? 'ok' : stale.error.code).toBe('CONFLICT_REVISION');
    const second = await k.cmd('moderation.ratepolicy.set', { ...good, burst: 40, expectedRevision: 1 }, { actor: operator });
    expect(second.ok && second.value.value).toMatchObject({ revision: 2 });
    expect(limiter.policyFor(k.tenantId, 'write.offer')).toMatchObject({ burst: 40, ratePerMinute: 10, prefixMultiplier: 5 });
  });

  it('TEST-PS-099-09.T07 a member cannot set policy or reset buckets; anonymous consume is keyed by the IP prefix only', async () => {
    const { k, limiter } = kernel();
    const set = await k.cmd('moderation.ratepolicy.set', good);
    const reset = await k.cmd('moderation.ratebucket.reset', { capabilityClass: 'write.offer', keyHash: 'a'.repeat(64) });
    expect(set.ok ? 'ok' : set.error.code).toBe('FORBIDDEN');
    expect(reset.ok ? 'ok' : reset.error.code).toBe('FORBIDDEN');
    const list = await k.ask('moderation.ratepolicy.list', {});
    expect(list.ok ? 'ok' : list.error.code).toBe('FORBIDDEN');
    expect(limiter.check(query({ actor: { kind: 'anonymous' }, network: '192.0.2.77' }))).toEqual({ allowed: true });
    const rows = limiter.snapshot();
    expect(rows.map((r) => r.scope).sort()).toEqual(['ip_prefix', 'tenant']);
    expect(JSON.stringify(rows)).not.toContain('192.0.2');
    // anonymous callers can read the status of the class (no key of their own is exposed)
    const own = await k.ask('moderation.ratebucket.get_status_own', { capabilityClass: 'write.offer' }, { actor: { kind: 'anonymous' } });
    expect(own.ok).toBe(true);
  });

  it('resets a bucket by key hash for an operator and answers NOT_FOUND for an unknown hash', async () => {
    const { k, limiter, operator } = kernel();
    limiter.check(query({ tenantId: k.tenantId }));
    const row = limiter.snapshot().find((r) => r.scope === 'actor');
    expect(row).toBeDefined();
    const done = await k.cmd('moderation.ratebucket.reset', { capabilityClass: 'write.offer', keyHash: row?.keyHash }, { actor: operator });
    expect(done.ok && done.value.value).toEqual({ reset: true });
    expect(limiter.snapshot().some((r) => r.scope === 'actor')).toBe(false);
    const missing = await k.cmd('moderation.ratebucket.reset', { capabilityClass: 'write.offer', keyHash: 'b'.repeat(64) }, { actor: operator });
    expect(missing.ok ? 'ok' : missing.error.code).toBe('NOT_FOUND');
  });

  it('shows a member the limit, remaining and reset time of their own bucket only', async () => {
    const { k, limiter } = kernel();
    const me = k.actor;
    if (me.kind !== 'user') throw new Error('unexpected actor');
    for (let i = 0; i < 3; i++) limiter.check({ ...query({ tenantId: k.tenantId, actor: me }) });
    const own = await k.ask('moderation.ratebucket.get_status_own', { capabilityClass: 'write.offer' }, { actor: me });
    expect(own.ok && own.value.value).toMatchObject({ limit: BUILTIN_POLICIES['write.offer']?.burst, remaining: 17 });
    const other = await k.ask('moderation.ratebucket.get_status_own', { capabilityClass: 'write.offer' }, { actor: k.user() });
    expect(other.ok && (other.value.value as { remaining: number }).remaining).toBe(20);
  });
});

describe('keys, privacy and salts', () => {
  it('TEST-PS-099-09.T04 addresses of one /24 or /48 share a prefix bucket, the salt rotates after a day, and no raw IP or actor key is stored or logged', () => {
    const { limiter, clock, destroyed, saltCalls, logs } = limiterSetup();
    const anon = (network: string) => query({ actor: { kind: 'anonymous' }, network });
    limiter.check(anon('192.0.2.10'));
    limiter.check(anon('192.0.2.200'));
    limiter.check(anon('2001:db8:1:1::5'));
    limiter.check(anon('2001:db8:1:2::9'));
    const prefixRows = limiter.snapshot().filter((r) => r.scope === 'ip_prefix');
    expect(prefixRows).toHaveLength(2);
    expect(new Set(prefixRows.map((r) => r.keyHash)).size).toBe(2);
    for (const r of prefixRows) expect(r.keyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(normalizePrefix('192.0.2.10')).toBe('192.0.2.0/24');
    expect(normalizePrefix('2001:db8:1:1::5')).toBe('2001:db8:1::/48');
    expect(normalizePrefix('2001:db8:1:ffff::/64')).toBe('2001:db8:1::/48');
    const before = prefixRows.map((r) => r.keyHash);
    // the same prefix hashes to the same value within a day and to another one after the salt rotates
    limiter.check(anon('192.0.2.99'));
    expect(limiter.snapshot().filter((r) => r.scope === 'ip_prefix').map((r) => r.keyHash).sort()).toEqual(before.sort());
    clock.advance(24 * 3_600_000);
    limiter.check(anon('192.0.2.10'));
    const after = limiter.snapshot().filter((r) => r.scope === 'ip_prefix');
    expect(after).toHaveLength(1);
    expect(before).not.toContain(after[0]?.keyHash);
    expect(destroyed).toEqual([saltCalls[0]]);
    // an authenticated actor never appears in rows or logs
    limiter.check(query({ actor: { kind: 'user', id: 'did:key:z6MkSecretActor', roles: [] }, network: '192.0.2.5' }));
    for (let i = 0; i < 40; i++) limiter.check(query({ actor: { kind: 'user', id: 'did:key:z6MkSecretActor', roles: [] } }));
    clock.advance(60_000);
    limiter.flushExceeded();
    const dump = JSON.stringify(limiter.snapshot()) + logs.lines().join('\n');
    expect(dump).not.toContain('192.0.2.');
    expect(dump).not.toContain('z6MkSecretActor');
    expect(dump).not.toContain('2001:db8');
  });

  it('treats invalid input as denied without throwing and a malformed hash as an internal failure that follows the fail mode', () => {
    const { limiter } = limiterSetup();
    expect(limiter.consume({ tenantId: '', capabilityClass: 'write.offer', actorKey: 'a' }).allowed).toBe(false);
    expect(limiter.consume({ tenantId: TENANT, capabilityClass: 'not a class', actorKey: 'a' }).allowed).toBe(false);
    expect(limiter.consume({ tenantId: TENANT, capabilityClass: 'write.offer', actorKey: 'a' }, 0).allowed).toBe(false);
    expect(limiter.consume({ tenantId: TENANT, capabilityClass: 'write.offer', actorKey: 'a' }, 1.5).allowed).toBe(false);
    expect(limiter.check({ ...query(), capability: 'x.y.z', tenantId: undefined as unknown as string })).toMatchObject({ allowed: false });
    const bad = createRateLimiter({ clock: createFakeClock(START), keyedHash: () => 'short', salt: () => 's' });
    const r = bad.check(query({ capability: 'platform.access_token.login' }));
    expect(r).toEqual({ allowed: false, retryAfterMs: 30_000 });
  });

  it('ignores backward wall-clock steps: elapsed time never goes negative and limits are not loosened', () => {
    const { limiter, clock } = limiterSetup();
    limiter.applyPolicy(TENANT, { capabilityClass: 'write.offer', algorithm: 'gcra', ratePerMinute: 1, burst: 2, prefixMultiplier: 20, failMode: 'open' });
    expect(limiter.check(query()).allowed).toBe(true);
    expect(limiter.check(query()).allowed).toBe(true);
    clock.set('2026-11-04T09:00:00.000Z');
    expect(limiter.check(query()).allowed).toBe(false);
    clock.advance(60_000);
    expect(limiter.check(query()).allowed).toBe(true);
  });

  it('applies the account multiplier from the limits module and drops it when moderation.limit.changed arrives', async () => {
    let mult = 0.5;
    const { limiter } = limiterSetup({ accountMultiplier: () => mult });
    const k = createTestKernel({ definitions: rateDefinitions({ limiter }).all, start: START });
    const actor = { kind: 'user' as const, id: 'did:key:z6MkMult', roles: [] };
    const first = limiter.consume({ tenantId: k.tenantId, capabilityClass: 'write.offer', actorKey: actor.id });
    expect(first.limit).toBe(10);
    mult = 2;
    expect(limiter.status({ tenantId: k.tenantId, capabilityClass: 'write.offer', actorKey: actor.id }).limit).toBe(10);
    const env = envelope(k.tenantId, 'moderation.limit.changed', { subjectKey: actor.id });
    expect(await k.outbox.deliver('moderation.rate_limit_refresh', env)).toBe('delivered');
    expect(limiter.status({ tenantId: k.tenantId, capabilityClass: 'write.offer', actorKey: actor.id }).limit).toBe(40);
  });
});

function envelope(tenantId: string, type: string, payload: unknown, eventId = '0192f400-0000-7000-8000-0000000000aa'): EventEnvelope {
  return {
    eventId, type, version: 1, tenantId, aggregate: { type: 'test', id: 'x' }, revision: 1, actor: { kind: 'system', id: 'test' }, occurredAt: START,
    correlationId: 'c1', causationId: 'c0', privacy: 'P2', payload, provenance: { origin: 'vault:test', sig: null },
  };
}

describe('penalties, throttled events and bus integration', () => {
  it('TEST-PS-099-09.T05 a spam throttle of two hours becomes factor 0.25 for one hour only, and a denial storm yields one rate.exceeded event per key per minute', async () => {
    const { limiter, clock, notices } = limiterSetup();
    const actorKey = 'did:key:z6MkSpammer';
    const defs = rateDefinitions({ limiter, resolveSubjectKey: (h) => (h === 'k_spam' ? actorKey : undefined) });
    const k = createTestKernel({ definitions: defs.all, start: START });
    const env = envelope(k.tenantId, 'moderation.spam.detected', { subjectKeyHash: 'k_spam', score: 72, throttle: { capability: 'bazaar.offer.make', windowMs: 60_000, ttlMs: 7_200_000 } });
    expect(await k.outbox.deliver('moderation.rate_spam_penalty', env)).toBe('delivered');
    expect(await k.outbox.deliver('moderation.rate_spam_penalty', env)).toBe('duplicate');
    const status = limiter.status({ tenantId: k.tenantId, capabilityClass: 'write.offer', actorKey });
    expect(status.penaltyUntil).toBe(new Date(clock.now() + 3_600_000).toISOString());
    // burst 20 * 0.25 = 5 immediate calls while the penalty runs
    let allowed = 0;
    for (let i = 0; i < 30; i++) if (limiter.check(query({ tenantId: k.tenantId, actor: { kind: 'user', id: actorKey, roles: [] } })).allowed) allowed += 1;
    expect(allowed).toBe(5);
    // reads are not penalized
    expect(limiter.status({ tenantId: k.tenantId, capabilityClass: 'read.default', actorKey }).penaltyUntil).toBeUndefined();
    // denial storm of 1000 calls inside one minute
    for (let i = 0; i < 1000; i++) limiter.check(query({ tenantId: k.tenantId, actor: { kind: 'user', id: actorKey, roles: [] } }));
    expect(limiter.flushExceeded()).toBe(0);
    expect(notices).toHaveLength(0);
    clock.advance(60_000);
    expect(limiter.flushExceeded()).toBe(1);
    expect(notices).toHaveLength(1);
    const notice = notices[0] as RateExceededNotice;
    expect(notice.deniedCount).toBe(25 + 1000);
    expect(notice.scope).toBe('actor');
    expect(notice.windowMs).toBe(60_000);
    const { tenantId: _t, ...payload } = notice;
    expect(rateExceededEvent.payload.safeParse(payload).success).toBe(true);
    // after the hour the penalty is gone and the full burst is back
    clock.advance(3_600_000);
    expect(limiter.status({ tenantId: k.tenantId, capabilityClass: 'write.offer', actorKey }).penaltyUntil).toBeUndefined();
    expect(limiter.status({ tenantId: k.tenantId, capabilityClass: 'write.offer', actorKey }).limit).toBe(20);
  });

  it('emits at most one notice per key per minute across several minutes of denials', () => {
    const { limiter, clock, notices } = limiterSetup();
    limiter.applyPolicy(TENANT, { capabilityClass: 'write.offer', algorithm: 'gcra', ratePerMinute: 1, burst: 1, prefixMultiplier: 20, failMode: 'open' });
    for (let minute = 0; minute < 3; minute++) {
      for (let i = 0; i < 50; i++) limiter.check(query());
      clock.advance(60_000);
    }
    limiter.flushExceeded();
    expect(notices.length).toBeLessThanOrEqual(3);
    expect(notices.length).toBeGreaterThanOrEqual(2);
    expect(notices.reduce((s, n) => s + n.deniedCount, 0)).toBeGreaterThan(100);
  });

  it('TEST-PS-099-09.T06 the registry accepts the definitions, the bus maps a denial to RATE_LIMITED with retryAfterMs, and the event payload validates', async () => {
    const { limiter, clock } = limiterSetup();
    limiter.applyPolicy(TENANT, { capabilityClass: 'write.offer', algorithm: 'gcra', ratePerMinute: 1, burst: 2, prefixMultiplier: 20, failMode: 'open' });
    const defs = rateDefinitions({ limiter });
    const make = defineCommand({ name: 'bazaar.offer.make', module: 'F01.S04.M01', capability: 'bazaar.offer.make', idempotent: false, input: z.strictObject({}), handler: () => ok({ made: true }) });
    const k = createTestKernel({ definitions: [...defs.all, make], rateLimit: limiter, start: START });
    clock.set(k.clock.now());
    // the test kernel tenant differs from the policy tenant, so the limiter falls back to the built-in write.offer policy
    limiter.applyPolicy(k.tenantId, { capabilityClass: 'write.offer', algorithm: 'gcra', ratePerMinute: 1, burst: 2, prefixMultiplier: 20, failMode: 'open' });
    expect((await k.cmd('bazaar.offer.make', {})).ok).toBe(true);
    expect((await k.cmd('bazaar.offer.make', {})).ok).toBe(true);
    const third = await k.cmd('bazaar.offer.make', {});
    expect(third.ok).toBe(false);
    if (!third.ok) {
      expect(third.error.code).toBe('RATE_LIMITED');
      expect(third.error.status).toBe(429);
      expect(third.error.retryAfterMs).toBe(60_000);
      expect(third.error.params).toEqual({ retryAfterMs: 60_000 });
    }
    // definitions carry the spec names, capabilities and module, and the bus decision shape is the kernel RateLimitPort
    expect(defs.all.map((d) => d.name)).toEqual([
      'moderation.ratepolicy.set', 'moderation.ratebucket.reset', 'moderation.ratepolicy.list', 'moderation.ratebucket.get_status_own', 'moderation.rate_spam_penalty', 'moderation.rate_limit_refresh',
    ]);
    for (const d of defs.all) expect(d.module).toBe('F12.S03.M03');
    expect(rateExceededEvent.type).toBe('moderation.rate.exceeded');
    expect(rateExceededEvent.payload.safeParse({ capabilityClass: 'write.offer', scope: 'actor', deniedCount: 0, windowMs: 60_000, observedAt: START }).success).toBe(false);
    expect(rateExceededEvent.payload.safeParse({ capabilityClass: 'write.offer', scope: 'actor', deniedCount: 3, windowMs: 60_000, observedAt: START, actorKey: 'raw' }).success).toBe(false);
    const own = await k.ask('moderation.ratebucket.get_status_own', { capabilityClass: 'write.offer', extra: true }, { actor: k.actor });
    expect(own.ok).toBe(false);
  });

  it('TEST-PS-099-09.T08 a policy change takes effect immediately without resetting buckets, and idle full-capacity buckets are evicted', async () => {
    const { limiter, clock } = limiterSetup();
    const defs = rateDefinitions({ limiter });
    const k = createTestKernel({ definitions: defs.all, authz: createRoleTableAuthz(RATE_ROLES), start: START });
    clock.set(k.clock.now());
    const actor = { kind: 'user' as const, id: 'did:key:z6MkPolicy', roles: [] };
    const operator = k.user(['operator']);
    const q = () => query({ tenantId: k.tenantId, actor });
    for (let i = 0; i < 20; i++) expect(limiter.check(q()).allowed).toBe(true);
    expect(limiter.check(q()).allowed).toBe(false);
    const set = await k.cmd('moderation.ratepolicy.set', { capabilityClass: 'write.offer', algorithm: 'gcra', ratePerMinute: 12, burst: 40 }, { actor: operator });
    expect(set.ok).toBe(true);
    // the bucket was not reset: the spent 20 are still counted, so exactly 20 of the new 40 remain
    let extra = 0;
    for (let i = 0; i < 40; i++) if (limiter.check(q()).allowed) extra += 1;
    expect(extra).toBe(20);
    // eviction: buckets that are back at full capacity go, buckets still recovering stay
    expect(limiter.evictIdle()).toBe(0);
    const lone = { kind: 'user' as const, id: 'did:key:z6MkLone', roles: [] };
    limiter.check(query({ tenantId: k.tenantId, actor: lone }));
    expect(limiter.bucketCount()).toBeGreaterThan(0);
    clock.advance(10 * 60_000);
    expect(limiter.evictIdle()).toBeGreaterThan(0);
    expect(limiter.bucketCount()).toBe(0);
  });
});

describe('store outages, restarts and abuse', () => {
  function flakyStore() {
    const inner = createMemoryCounterStore();
    const control = { down: false };
    const guard = <T>(f: () => T): T => { if (control.down) throw new Error('counter store unavailable'); return f(); };
    const store: CounterStore = {
      get: (k) => guard(() => inner.get(k)), set: (k, s: BucketState) => guard(() => inner.set(k, s)), delete: (k) => guard(() => inner.delete(k)),
      entries: () => guard(() => inner.entries()), get size() { return inner.size; },
    };
    return { store, control };
  }

  it('TEST-PS-099-09.T09 with the store down reads fail open at half rate, relay.access fails closed for 30 s, and a restart loosens a limit by at most one burst', () => {
    const { store, control } = flakyStore();
    const { limiter, clock } = limiterSetup({ store });
    const reader = { kind: 'user' as const, id: 'did:key:z6MkReader', roles: [] };
    control.down = true;
    const read = (): boolean => limiter.check(query({ actor: reader, capability: 'discovery.listing.get', operation: 'discovery.listing.get', kind: 'query' })).allowed;
    let readsAllowed = 0;
    for (let i = 0; i < 200; i++) if (read()) readsAllowed += 1;
    expect(readsAllowed).toBe(BUILTIN_POLICIES['read.default'] ? (BUILTIN_POLICIES['read.default'].burst) / 2 : -1);
    const login = () => limiter.check(query({ actor: { kind: 'anonymous' }, network: '192.0.2.4', capability: 'platform.access_token.login', operation: 'platform.access_token.login' }));
    expect(login()).toEqual({ allowed: false, retryAfterMs: 30_000 });
    clock.advance(10_000);
    expect(login()).toEqual({ allowed: false, retryAfterMs: 20_000 });
    clock.advance(20_000);
    control.down = false;
    expect(login()).toEqual({ allowed: true });

    // restart mid-run: persisted snapshot (at most 5 s old) restores the state, an empty restart loosens by at most one burst
    const a = limiterSetup();
    const spend = (l: typeof a.limiter, n: number): number => { let ok = 0; for (let i = 0; i < n; i++) if (l.check(query()).allowed) ok += 1; return ok; };
    expect(spend(a.limiter, 100)).toBe(20);
    const rows = JSON.parse(JSON.stringify(a.limiter.snapshot())) as ReturnType<typeof a.limiter.snapshot>;
    a.clock.advance(2000);
    const restored = createRateLimiter({ clock: a.clock, keyedHash: hmac, salt: (d) => `salt-${d}` });
    expect(restored.restore(rows)).toBe(rows.length);
    const afterRestore = spend(restored, 100);
    expect(afterRestore).toBeLessThanOrEqual(1);
    const empty = createRateLimiter({ clock: a.clock, keyedHash: hmac, salt: (d) => `salt-${d}` });
    const afterEmptyRestart = spend(empty, 100);
    expect(afterEmptyRestart).toBeLessThanOrEqual(20);
    expect(afterEmptyRestart).toBeGreaterThan(0);
  });

  it('TEST-PS-099-09.T10 twenty keys on one /24 reach the prefix limit at five times the actor limit, and rotating keys does not beat the tenant cap', () => {
    const { limiter } = limiterSetup({ tenantCapPerMinute: 200 });
    let allowed = 0;
    let firstActorAllowed = 0;
    for (let round = 0; round < 20; round++) {
      for (let user = 0; user < 20; user++) {
        const r = limiter.check({ ...offer(user), network: '192.0.2.50' });
        if (r.allowed) { allowed += 1; if (user === 0) firstActorAllowed += 1; }
      }
    }
    // write.offer burst 20, prefix multiplier 5: the /24 allows 100 although 20 actors could each send 20
    expect(allowed).toBe(100);
    expect(firstActorAllowed).toBeLessThanOrEqual(20);
    // an attacker rotating 50 keys across 50 prefixes is stopped by the tenant-wide cap of 200 per minute
    const rot = limiterSetup({ tenantCapPerMinute: 200 });
    let total = 0;
    for (let i = 0; i < 50; i++) for (let j = 0; j < 20; j++) if (rot.limiter.check({ ...offer(1000 + i), network: `198.51.${i}.9` }).allowed) total += 1;
    expect(total).toBe(200);
  });

  it('TEST-PS-099-09.T11 buckets older than 24 hours are purged and the module persists no bucket records', async () => {
    const { limiter, clock } = limiterSetup();
    const defs = rateDefinitions({ limiter });
    const k = createTestKernel({ definitions: defs.all, rateLimit: limiter, start: START });
    clock.set(k.clock.now());
    const make = defineCommand({ name: 'bazaar.offer.make', module: 'F01.S04.M01', capability: 'bazaar.offer.make', idempotent: false, input: z.strictObject({}), handler: () => ok(null) });
    k.registry.add(make);
    for (let i = 0; i < 5; i++) expect((await k.cmd('bazaar.offer.make', {})).ok).toBe(true);
    expect(limiter.bucketCount()).toBeGreaterThan(0);
    const persisted = await k.storage.read((tx) => tx.records.query({ tenant: k.tenantId, type: 'moderation.ratebucket', filters: [], orderSlot: 0, dir: 'asc', limit: 10 }));
    expect(persisted).toHaveLength(0);
    const policies = await k.storage.read((tx) => tx.records.query({ tenant: k.tenantId, type: ratePolicyRepo.type, filters: [], orderSlot: 0, dir: 'asc', limit: 10 }));
    expect(policies).toHaveLength(0);
    clock.advance(24 * 3_600_000 + 1);
    limiter.evictIdle();
    expect(limiter.bucketCount()).toBe(0);
    expect(limiter.snapshot()).toEqual([]);
  });

  it('vault mode keeps a single local scope for UX throttles and never reports to anyone', () => {
    const { limiter } = limiterSetup({ mode: 'vault' });
    limiter.applyPolicy(TENANT, { capabilityClass: 'write.offer', algorithm: 'gcra', ratePerMinute: 6, burst: 10, prefixMultiplier: 5, failMode: 'open' });
    let allowed = 0;
    for (let i = 0; i < 15; i++) if (limiter.check(query({ network: '192.0.2.1' })).allowed) allowed += 1;
    expect(allowed).toBe(10);
    expect(new Set(limiter.snapshot().map((r) => r.scope))).toEqual(new Set(['local']));
  });
});
