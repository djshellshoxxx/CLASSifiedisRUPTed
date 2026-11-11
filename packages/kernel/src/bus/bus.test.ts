import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { createUuidV7Generator } from '../ids/uuidv7.ts';
import { requestHash } from '../hash/canonical.ts';
import { COMMON_ERRORS } from '../errors/codes.ts';
import { createTestKernel } from '../testing/harness.ts';
import { itemRepo, SAMPLE_MODULE, sampleDefinitions, type SampleCounters } from '../testing/sample-module.ts';
import { createRegistry, defineCommand } from './define.ts';
import { ok } from '../errors/result.ts';
import type { AuthzPort, RateLimitPort, RateQuery } from './ports.ts';
import { ANONYMOUS, createFixedWindowRateLimiter, rateKey } from './ports.ts';
import { createBus } from './bus.ts';

function kernel(opts: Parameters<typeof createTestKernel>[0] = {}) {
  const counters: SampleCounters = { create: 0, consumed: [], failConsumer: 0 };
  const defs = sampleDefinitions(counters);
  const k = createTestKernel({ ...opts, definitions: defs.all });
  return { k, counters, newId: () => k.ids.next() };
}

describe('command bus pipeline (PS-117)', () => {
  it('TEST-PS-117-09.T09 stages run in order flag → authn → rate limit → validation → authorize → handler and short-circuit', async () => {
    const gate = { flag: false, rate: false, allow: false };
    const authz: AuthzPort = { authorize: () => (gate.allow ? { allow: true } : { allow: false, code: 'FORBIDDEN' }) };
    const rateLimit: RateLimitPort = { check: () => (gate.rate ? { allowed: true } : { allowed: false, retryAfterMs: 1000 }) };
    const counters: SampleCounters = { create: 0, consumed: [], failConsumer: 0 };
    const k = createTestKernel({ definitions: sampleDefinitions(counters).all, authz, rateLimit, disabledModules: [SAMPLE_MODULE] });
    const anon = { kind: 'anonymous' as const };
    const valid = { itemId: k.ids.next(), name: 'lamp' };
    const code = async (input: unknown, actor = k.actor) => {
      const r = await k.cmd('sample.item.create', input, { actor });
      return r.ok ? 'OK' : r.error.code;
    };
    expect(await code({ bad: 1 }, anon)).toBe('FEATURE_DISABLED');
    k.flags.set(SAMPLE_MODULE, true);
    expect(await code({ bad: 1 }, anon)).toBe('UNAUTHENTICATED');
    expect(await code({ bad: 1 })).toBe('RATE_LIMITED');
    gate.rate = true;
    expect(await code({ bad: 1 })).toBe('VALIDATION_FAILED');
    expect(await code(valid)).toBe('FORBIDDEN');
    expect(counters.create).toBe(0);
    gate.allow = true;
    expect(await code(valid)).toBe('OK');
    expect(counters.create).toBe(1);
    expect((await k.cmd('sample.unknown.op', {})).ok).toBe(false);
    expect(() => createRegistry().add(sampleDefinitions().create, sampleDefinitions().create)).toThrow('duplicate');
    expect(() => defineCommand({ name: 'Bad Name', module: SAMPLE_MODULE, capability: 'sample.item.create', input: z.strictObject({}), idempotent: false, handler: () => ok(1) })).toThrow();
    expect(() => defineCommand({ name: 'sample.item.x', module: 'bazaar', capability: 'sample.item.create', input: z.strictObject({}), idempotent: false, handler: () => ok(1) })).toThrow('module');
  });

  it('TEST-PS-117-09.T10 same key and body replays the stored response; a different body returns IDEMPOTENCY_KEY_REUSED', async () => {
    const { k, counters, newId } = kernel();
    const key = newId();
    const input = { itemId: newId(), name: 'lamp' };
    const first = await k.cmd('sample.item.create', input, { idempotencyKey: key });
    const second = await k.cmd('sample.item.create', { name: 'lamp', itemId: input.itemId }, { idempotencyKey: key });
    expect(first.ok && first.value).toMatchObject({ status: 201, replayed: false, value: { itemId: input.itemId, revision: 1 } });
    expect(second.ok && second.value).toMatchObject({ status: 201, replayed: true, value: { itemId: input.itemId, revision: 1 }, events: [] });
    expect(counters.create).toBe(1);
    expect(k.events).toHaveLength(1);
    const reused = await k.cmd('sample.item.create', { ...input, name: 'other' }, { idempotencyKey: key });
    expect(!reused.ok && reused.error).toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED', status: 422 });
    const rec = await k.storage.read((tx) => tx.idempotency.lookup({ tenant: k.tenantId, actor: k.actor.kind === 'anonymous' ? '' : k.actor.id, command: 'sample.item.create', key }, k.clock.now()));
    expect(rec).toMatchObject({ requestHash: await requestHash(input), status: 201, response: { itemId: input.itemId, revision: 1 }, createdAt: '2026-11-04T10:00:00.000Z', expiresAt: '2026-11-05T10:00:00.000Z' });
    const other = await k.cmd('sample.item.create', { itemId: newId(), name: 'x' }, { idempotencyKey: key, actor: k.user() });
    expect(other.ok && other.value.replayed).toBe(false);
  });

  it('TEST-PS-117-09.T11 handler err or exception rolls back records, outbox and idempotency; exceptions become INTERNAL', async () => {
    const { k, newId } = kernel();
    const id1 = newId();
    const key1 = newId();
    const r1 = await k.cmd('sample.item.fail', { itemId: id1, mode: 'err' }, { idempotencyKey: key1 });
    expect(!r1.ok && r1.error).toMatchObject({ code: 'CONFLICT_STATE', params: { state: 'doomed' } });
    const id2 = newId();
    const r2 = await k.cmd('sample.item.fail', { itemId: id2, mode: 'throw' });
    expect(!r2.ok && r2.error).toEqual({ code: 'INTERNAL', status: 500, retryable: true, messageKey: 'error.internal', params: {} });
    const state = await k.storage.read((tx) => ({
      records: [id1, id2].map((id) => tx.records.get(k.tenantId, itemRepo.type, id)),
      pending: tx.outbox.pending('any', ['sample.item.created'], k.clock.now(), 10),
      idem: tx.idempotency.lookup({ tenant: k.tenantId, actor: k.actor.kind === 'anonymous' ? '' : k.actor.id, command: 'sample.item.fail', key: key1 }, k.clock.now()),
    }));
    expect(state).toEqual({ records: [undefined, undefined], pending: [], idem: undefined });
    expect(k.events).toEqual([]);
    const failed = k.logs.records().find((l) => l['msg'] === 'command.failed');
    expect(failed).toMatchObject({ level: 'error', code: 'INTERNAL', module: SAMPLE_MODULE, error: { name: 'Error' } });
    expect(typeof failed?.['correlationId']).toBe('string');
    const retry = await k.cmd('sample.item.fail', { itemId: id1, mode: 'err' }, { idempotencyKey: key1 });
    expect(!retry.ok && retry.error.code).toBe('CONFLICT_STATE');
  });

  it('TEST-PS-117-09.T12 concurrent dispatches with one key run the handler once', async () => {
    const { k, counters, newId } = kernel();
    const key = newId();
    const input = { itemId: newId(), name: 'race' };
    const results = await Promise.all(Array.from({ length: 5 }, () => k.cmd('sample.item.create', input, { idempotencyKey: key })));
    expect(counters.create).toBe(1);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(results.filter((r) => r.ok && !r.value.replayed)).toHaveLength(1);
  });

  it('TEST-PS-117-09.T13 idempotency records expire after 24 h, are ignored after expiry and purged', async () => {
    const { k, counters, newId } = kernel();
    const key = newId();
    const input = { itemId: newId(), name: 'lamp' };
    await k.cmd('sample.item.create', input, { idempotencyKey: key });
    k.clock.advance(24 * 3600_000 - 1);
    expect((await k.cmd('sample.item.create', input, { idempotencyKey: key })).ok).toBe(true);
    expect(counters.create).toBe(1);
    k.clock.advance(1);
    const again = await k.cmd('sample.item.create', input, { idempotencyKey: key });
    expect(counters.create).toBe(2);
    expect(!again.ok && again.error.code).toBe('CONFLICT_REVISION');
    const purged = await k.storage.transaction((tx) => ok(tx.idempotency.purgeExpired(k.clock.now())));
    expect(purged.ok && purged.value).toBe(1);
  });

  it('TEST-PS-117-09.T14 authorization: deny is FORBIDDEN or hidden as NOT_FOUND; anonymous is UNAUTHENTICATED; vault commands are not remote', async () => {
    const authz: AuthzPort = { authorize: (actor, cap) => (actor.kind !== 'anonymous' && actor.roles.includes('admin') ? { allow: true } : cap === 'sample.relay.ping' ? { allow: true } : { allow: false, code: 'FORBIDDEN' }) };
    const { k, newId } = kernel({ authz });
    const admin = k.user(['admin']);
    const itemId = newId();
    expect((await k.cmd('sample.item.create', { itemId, name: 'a' }, { actor: admin })).ok).toBe(true);
    const denied = await k.cmd('sample.item.create', { itemId: newId(), name: 'a' });
    expect(!denied.ok && denied.error.code).toBe('FORBIDDEN');
    const hidden = await k.cmd('sample.item.rename', { itemId, name: 'b', expectedRevision: 1 });
    expect(!hidden.ok && hidden.error.code).toBe('NOT_FOUND');
    const anon = await k.cmd('sample.item.create', { itemId: newId(), name: 'a' }, { actor: { kind: 'anonymous' } });
    expect(!anon.ok && anon.error.code).toBe('UNAUTHENTICATED');
    const remote = await k.bus.dispatch({ actor: admin, tenantId: k.tenantId, origin: 'remote' }, 'sample.item.rename', { itemId, name: 'b', expectedRevision: 1 }, { idempotencyKey: newId() });
    expect(!remote.ok && remote.error.code).toBe('NOT_FOUND');
    const pub = await k.bus.dispatch({ actor: { kind: 'anonymous' }, tenantId: k.tenantId, origin: 'remote' }, 'sample.relay.ping', {});
    expect(pub.ok && pub.value.value).toEqual({ pong: true });
  });

  it('TEST-PS-117-09.T15 audit records allow and deny with actor, capability, resource and decision, never payload', async () => {
    let allow = false;
    const { k, newId } = kernel({ authz: { authorize: () => (allow ? { allow: true } : { allow: false, code: 'FORBIDDEN' }) } });
    const itemId = newId();
    await k.cmd('sample.item.rename', { itemId, name: 'secret-name-123', expectedRevision: 1 });
    allow = true;
    await k.cmd('sample.item.create', { itemId, name: 'secret-name-123' });
    await k.ask('sample.item.get', { itemId });
    expect(k.audit).toHaveLength(2);
    expect(k.audit[0]).toMatchObject({ decision: 'deny', outcome: 'denied', code: 'NOT_FOUND', capability: 'sample.item.rename', resource: { type: 'item', id: itemId }, tenantId: k.tenantId });
    expect(k.audit[1]).toMatchObject({ decision: 'allow', outcome: 'ok', capability: 'sample.item.create', operation: 'sample.item.create', actor: { kind: 'user' } });
    expect(JSON.stringify(k.audit)).not.toContain('secret-name-123');
  });

  it('TEST-PS-117-09.T16 idempotent commands require a UUIDv7 Idempotency-Key', async () => {
    const { k, newId } = kernel();
    const input = { itemId: newId(), name: 'lamp' };
    const missing = await k.cmd('sample.item.create', input, { idempotencyKey: 'none' });
    expect(!missing.ok && missing.error.fields).toEqual([{ path: 'idempotencyKey', code: 'REQUIRED' }]);
    const bad = await k.cmd('sample.item.create', input, { idempotencyKey: '0192f3a4-5b6c-4d8e-9f01-23456789abcd' });
    expect(!bad.ok && bad.error.fields).toEqual([{ path: 'idempotencyKey', code: 'INVALID_UUIDV7' }]);
    const future = createUuidV7Generator({ now: () => k.clock.now() + 25 * 3600_000 }).next();
    const skew = await k.cmd('sample.item.create', input, { idempotencyKey: future });
    expect(!skew.ok && skew.error.code).toBe('ID_TIMESTAMP_SKEW');
    expect((await k.cmd('sample.relay.ping', {})).ok).toBe(true);
  });

  it('TEST-PS-117-09.T17 RATE_LIMITED carries retryAfterMs; only RATE_LIMITED, DEPENDENCY_UNAVAILABLE and INTERNAL are retryable', async () => {
    const counters: SampleCounters = { create: 0, consumed: [], failConsumer: 0 };
    const k0 = createTestKernel({ definitions: sampleDefinitions(counters).all });
    const k = createTestKernel({ definitions: sampleDefinitions(counters).all, rateLimit: createFixedWindowRateLimiter({ limit: 1, windowMs: 60_000, clock: k0.clock }) });
    expect((await k.cmd('sample.relay.ping', {})).ok).toBe(true);
    k0.clock.advance(15_000);
    const limited = await k.cmd('sample.relay.ping', {});
    expect(!limited.ok && limited.error).toMatchObject({ code: 'RATE_LIMITED', status: 429, retryable: true, retryAfterMs: 45_000 });
    const retryable = Object.entries(COMMON_ERRORS).filter(([, v]) => v.retryable).map(([c]) => c).sort();
    expect(retryable).toEqual(['DEPENDENCY_UNAVAILABLE', 'INTERNAL', 'RATE_LIMITED']);
    const busy = await k.cmd('sample.item.fail', { itemId: k.ids.next(), mode: 'busy' });
    expect(!busy.ok && busy.error).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE', retryable: true, status: 503 });
  });

  it('TEST-PS-117-09.T20 command metrics: classrup_command_total{module,outcome,code} and classrup_command_duration_ms', async () => {
    const { k, newId } = kernel();
    const key = newId();
    const input = { itemId: newId(), name: 'm' };
    await k.cmd('sample.item.create', input, { idempotencyKey: key });
    await k.cmd('sample.item.create', input, { idempotencyKey: key });
    await k.cmd('sample.item.create', { bad: true });
    expect(k.metrics.value('classrup_command_total', { module: SAMPLE_MODULE, outcome: 'ok', code: 'OK' })).toBe(1);
    expect(k.metrics.value('classrup_command_total', { module: SAMPLE_MODULE, outcome: 'replayed', code: 'OK' })).toBe(1);
    expect(k.metrics.value('classrup_command_total', { module: SAMPLE_MODULE, outcome: 'rejected', code: 'VALIDATION_FAILED' })).toBe(1);
    expect(k.metrics.value('classrup_command_duration_ms', { module: SAMPLE_MODULE, outcome: 'ok' })).toBe(1);
    expect(k.metrics.render()).toContain('classrup_command_duration_ms_bucket{module="F99.S01.M01",outcome="ok",le="5"}');
  });

  it('TEST-PS-117-09.T21 one log line per command with correlationId, module, code and durationMs and no input values', async () => {
    const { k, newId } = kernel();
    const correlationId = newId();
    await k.cmd('sample.item.create', { itemId: newId(), name: 'very-private-title' }, { correlationId });
    const lines = k.logs.records().filter((l) => l['msg'] === 'command.completed');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ level: 'info', correlationId, module: SAMPLE_MODULE, code: 'OK', operation: 'sample.item.create' });
    expect(typeof lines[0]?.['durationMs']).toBe('number');
    expect(Object.keys(lines[0] ?? {}).slice(0, 7)).toEqual(['ts', 'level', 'msg', 'correlationId', 'module', 'code', 'durationMs']);
    expect(k.logs.exportJsonl()).not.toContain('very-private-title');
  });

  it('TEST-PS-117-09.T25 events are written to the outbox in the handler transaction and published only after commit', async () => {
    const { k, newId } = kernel();
    const itemId = newId();
    const r = await k.cmd('sample.item.create', { itemId, name: 'lamp' });
    expect(r.ok && r.value.events).toHaveLength(1);
    const env = r.ok ? r.value.events[0] : undefined;
    expect(env).toMatchObject({ type: 'sample.item.created', tenantId: k.tenantId, aggregate: { type: 'item', id: itemId }, revision: 1, privacy: 'P1', provenance: { origin: 'vault:test', sig: null } });
    expect(env?.causationId).not.toBe(env?.correlationId);
    expect(await k.storage.read((tx) => tx.outbox.get(env?.eventId ?? '')?.payload)).toEqual({ itemId, name: 'lamp' });
    expect(k.events.map((e) => e.eventId)).toEqual([env?.eventId]);
    const pub = await k.cmd('sample.item.publish', { itemId, destination: 'relay:a' });
    expect(pub.ok && pub.value.value).toMatchObject({ state: 'prepared' });
    const notEligible = await k.cmd('sample.item.fail', { itemId: newId(), mode: 'sync' });
    expect(!notEligible.ok && notEligible.error.code).toBe('INTERNAL');
    expect(k.events).toHaveLength(1);
    const q = await k.ask('sample.item.get', { itemId });
    expect(q.ok && q.value.value).toEqual({ itemId, name: 'lamp', revision: 1 });
  });

  it('TEST-PS-117-09.T17 anonymous callers are rate limited per network prefix; prefixes do not share a bucket', async () => {
    const { k } = kernel();
    const seen: RateQuery[] = [];
    const window = createFixedWindowRateLimiter({ limit: 2, windowMs: 60_000, clock: k.clock });
    const rate: RateLimitPort = { check: (q) => (seen.push(q), window.check(q)) };
    const bus = createBus({ registry: k.registry, storage: k.storage, clock: k.clock, ids: k.ids, authz: { authorize: () => ({ allow: true }) }, rateLimit: rate });
    const from = (network?: string) => bus.dispatch({ actor: ANONYMOUS, tenantId: k.tenantId, origin: 'remote', ...(network ? { network } : {}) }, 'sample.relay.ping', {});
    const codes = async (network?: string) => {
      const r = await from(network);
      return r.ok ? 'OK' : r.error.code;
    };
    expect([await codes('192.0.2.0/24'), await codes('192.0.2.0/24'), await codes('192.0.2.0/24')]).toEqual(['OK', 'OK', 'RATE_LIMITED']);
    expect([await codes('198.51.100.0/24'), await codes('2001:db8:1::/48'), await codes('2001:db8:1::/48')]).toEqual(['OK', 'OK', 'OK']);
    expect(await codes('2001:db8:1::/48')).toBe('RATE_LIMITED');
    expect([await codes(), await codes(), await codes()]).toEqual(['OK', 'OK', 'RATE_LIMITED']);
    expect(seen[0]).toMatchObject({ network: '192.0.2.0/24', actor: { kind: 'anonymous' }, operation: 'sample.relay.ping' });
    expect(seen.at(-1)).not.toHaveProperty('network');
    const member = { kind: 'user' as const, id: 'did:key:z6MkMember', roles: ['member'] };
    const base = { tenantId: 't', operation: 'o.p.q', capability: 'o.p.q', kind: 'command' as const, now: 0 };
    expect(rateKey({ ...base, actor: member, network: '192.0.2.0/24' })).toBe(rateKey({ ...base, actor: member, network: '198.51.100.0/24' }));
    expect(rateKey({ ...base, actor: ANONYMOUS, network: '192.0.2.0/24' })).not.toBe(rateKey({ ...base, actor: ANONYMOUS, network: '198.51.100.0/24' }));
    k.clock.advance(60_000);
    expect(await codes('192.0.2.0/24')).toBe('OK');
  });

  it('TEST-PS-117-09.T25 a throwing EventSink after commit is logged; the committed command still returns its ok result once', async () => {
    const { k, counters, newId } = kernel();
    let calls = 0;
    const sink = {
      publish: () => {
        calls += 1;
        throw new Error('ui listener failed');
      },
    };
    const bus = createBus({ registry: k.registry, storage: k.storage, clock: k.clock, ids: k.ids, authz: { authorize: () => ({ allow: true }) }, eventSink: sink, logger: k.logger, metrics: k.metrics });
    const itemId = newId();
    const key = newId();
    const ctx = { actor: k.actor, tenantId: k.tenantId };
    const r = await bus.dispatch(ctx, 'sample.item.create', { itemId, name: 'lamp' }, { idempotencyKey: key });
    expect(r.ok && r.value).toMatchObject({ status: 201, replayed: false, value: { itemId, revision: 1 } });
    expect(calls).toBe(1);
    expect(await k.storage.read((tx) => tx.records.get(k.tenantId, 'sample.item', itemId)?.revision)).toBe(1);
    const again = await bus.dispatch(ctx, 'sample.item.create', { itemId, name: 'lamp' }, { idempotencyKey: key });
    expect(again.ok && again.value.replayed).toBe(true);
    expect(counters.create).toBe(1);
    expect(calls).toBe(1);
    const failed = k.logs.records().filter((l) => l['msg'] === 'event_sink.failed');
    expect(failed).toHaveLength(1);
    expect(failed[0]).toMatchObject({ level: 'error', module: SAMPLE_MODULE, operation: 'sample.item.create', count: 1 });
    expect(k.logs.records().filter((l) => l['msg'] === 'command.completed')).toHaveLength(2);
    expect(k.metrics.value('classrup_command_total', { module: SAMPLE_MODULE, outcome: 'ok', code: 'OK' })).toBe(1);
    expect(k.logs.exportJsonl()).not.toContain('lamp');
  });
});
