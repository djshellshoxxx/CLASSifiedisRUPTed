import { afterEach, describe, expect, it } from 'vitest';
import { createFakeClock } from '../clock/clock.ts';
import { err, ok } from '../errors/result.ts';
import { appError } from '../errors/app-error.ts';
import { createDeterministicIds } from '../ids/uuidv7.ts';
import { createLogger, createRingBufferSink } from '../observability/logger.ts';
import { createMetricsRegistry } from '../observability/metrics.ts';
import { createReadiness } from '../observability/readiness.ts';
import { createBus } from '../bus/bus.ts';
import { createRegistry } from '../bus/define.ts';
import { createMemoryAudit, createRoleTableAuthz, type Actor, type SessionPort } from '../bus/ports.ts';
import { openSqliteStorage } from '../storage/sqlite.ts';
import { sampleDefinitions } from '../testing/sample-module.ts';
import { createHttpHandler, startHttpServer, type RunningServer } from './server.ts';

const servers: RunningServer[] = [];
afterEach(async () => {
  for (const s of servers.splice(0)) await s.close(1000);
});

async function relay(opts: { lag?: number } = {}) {
  const clock = createFakeClock('2026-11-04T10:00:00.000Z');
  const ids = createDeterministicIds({ seed: 3, now: () => clock.now() });
  const storage = openSqliteStorage({ path: ':memory:' });
  const registry = createRegistry().add(...sampleDefinitions().all);
  const metrics = createMetricsRegistry();
  const logs = createRingBufferSink();
  const logger = createLogger({ sink: logs.sink, clock });
  const authz = createRoleTableAuthz({ 'sample.item.create': ['member'], 'sample.item.read': ['member'], 'sample.relay.ping': ['anonymous'], 'platform.metrics.read': ['operator'] });
  const tenantId = ids.next();
  const users: Record<string, Actor> = { 'member-token': { kind: 'user', id: 'did:key:z6MkMember', roles: ['member'] }, 'operator-token': { kind: 'operator', id: 'did:key:z6MkOp', roles: ['operator'] } };
  const sessions: SessionPort = { resolve: async (t) => (t === undefined ? ok({ actor: { kind: 'anonymous' }, tenantId }) : users[t] ? ok({ actor: users[t] as Actor, tenantId }) : err(appError('UNAUTHENTICATED'))) };
  const bus = createBus({ registry, storage, clock, ids, authz, audit: createMemoryAudit(), metrics, logger, origin: 'relay:test' });
  const readiness = createReadiness({ storage, lagMs: () => opts.lag ?? 0 });
  const handler = createHttpHandler({ bus, sessions, authz, ids, clock, metrics, readiness, logger });
  const server = await startHttpServer(handler);
  servers.push(server);
  const base = `http://127.0.0.1:${server.port}`;
  const call = (path: string, init: RequestInit & { token?: string } = {}) => {
    const headers = new Headers(init.headers);
    if (init.token) headers.set('authorization', `Bearer ${init.token}`);
    return fetch(`${base}${path}`, { ...init, headers });
  };
  const post = (path: string, body: unknown, headers: Record<string, string> = {}, token = 'member-token') => call(path, { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers }, token });
  return { call, post, ids, handler, server, logs, storage };
}

describe('relay HTTP adapter (PS-117, PS-121)', () => {
  it('TEST-PS-117-09.T19 end to end: sample command, replay header, problem+json, limits, media type, methods, headers', async () => {
    const r = await relay();
    const key = r.ids.next();
    const itemId = r.ids.next();
    const corr = r.ids.next();
    const res = await r.post('/api/v1/cmd/sample.item.create', { itemId, name: 'lamp' }, { 'idempotency-key': key, 'x-correlation-id': corr });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ itemId, revision: 1 });
    expect(res.headers.get('x-correlation-id')).toBe(corr);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('idempotent-replay')).toBeNull();
    const replay = await r.post('/api/v1/cmd/sample.item.create', { name: 'lamp', itemId }, { 'idempotency-key': key });
    expect(replay.status).toBe(201);
    expect(replay.headers.get('idempotent-replay')).toBe('true');
    const reuse = await r.post('/api/v1/cmd/sample.item.create', { itemId, name: 'other' }, { 'idempotency-key': key });
    expect(reuse.status).toBe(422);
    expect(reuse.headers.get('content-type')).toBe('application/problem+json');
    const problem = (await reuse.json()) as Record<string, unknown>;
    expect(problem).toMatchObject({ type: 'urn:classrup:error:IDEMPOTENCY_KEY_REUSED', code: 'IDEMPOTENCY_KEY_REUSED', status: 422, retryAfterMs: null });
    expect(typeof problem['correlationId']).toBe('string');
    const q = await r.post('/api/v1/query/sample.item.get', { itemId });
    expect(await q.json()).toEqual({ itemId, name: 'lamp', revision: 1 });
    expect((await r.post('/api/v1/cmd/sample.item.create', 'x'.repeat(300 * 1024), { 'idempotency-key': r.ids.next() })).status).toBe(413);
    expect((await r.call('/api/v1/cmd/sample.item.create', { method: 'POST', body: 'a=b', headers: { 'content-type': 'application/x-www-form-urlencoded' }, token: 'member-token' })).status).toBe(415);
    const m405 = await r.call('/api/v1/cmd/sample.item.create', { method: 'GET' });
    expect(m405.status).toBe(405);
    expect(m405.headers.get('allow')).toBe('POST');
    expect((await r.post('/api/v1/cmd/sample.item.create', '{bad json', { 'idempotency-key': r.ids.next() })).status).toBe(422);
    expect((await r.post('/api/v1/cmd/sample.item.create', { itemId: r.ids.next(), name: 'x' }, { 'idempotency-key': r.ids.next() }, 'stolen')).status).toBe(401);
    expect((await r.post('/api/v1/cmd/sample.item.create', { itemId: r.ids.next(), name: 'x' }, {}, '')).status).toBe(401);
    expect((await r.post('/api/v1/cmd/sample.item.rename', { itemId, name: 'x', expectedRevision: 1 }, { 'idempotency-key': r.ids.next() })).status).toBe(404);
    expect((await r.post('/api/v2/cmd/sample.item.create', {})).status).toBe(404);
    expect((await r.call('/nope')).status).toBe(404);
    const ping = await r.post('/api/v1/cmd/sample.relay.ping', {}, {}, '');
    expect(ping.status).toBe(200);
    const http = r.logs.records().filter((l) => l['msg'] === 'http.request');
    expect(http.length).toBeGreaterThan(5);
    expect(http.every((l) => l['ip'] === '127.0.0.0/24')).toBe(true);
    expect(r.logs.exportJsonl()).not.toMatch(/member-token|lamp/);
  });

  it('TEST-PS-121-09.T09 /healthz and /readyz expose only status booleans; draining turns readiness to 503', async () => {
    const r = await relay();
    const h = await r.call('/healthz');
    expect(h.status).toBe(200);
    expect(await h.json()).toEqual({ status: 'ok' });
    const ready = await r.call('/readyz');
    expect(ready.status).toBe(200);
    expect(await ready.json()).toEqual({ status: 'ready', checks: { storage: true, migrations: true, outboxLag: true }, lagMs: 0 });
    r.handler.setDraining(true);
    const draining = await r.call('/readyz');
    expect(draining.status).toBe(503);
    expect(await draining.json()).toEqual({ status: 'unready', checks: { draining: true } });
    const lagging = await relay({ lag: 61_000 });
    const lag = await lagging.call('/readyz');
    expect(lag.status).toBe(503);
    expect(((await lag.json()) as { checks: Record<string, boolean> }).checks).toEqual({ storage: true, migrations: true, outboxLag: false });
    await r.server.close(500);
    servers.splice(servers.indexOf(r.server), 1);
    await expect(r.call('/healthz')).rejects.toThrow();
  });

  it('TEST-PS-121-09.T10 /metrics requires a relay token holding platform.metrics.read', async () => {
    const r = await relay();
    await r.post('/api/v1/cmd/sample.item.create', { itemId: r.ids.next(), name: 'x' }, { 'idempotency-key': r.ids.next() });
    expect((await r.call('/metrics')).status).toBe(401);
    expect((await r.call('/metrics', { token: 'member-token' })).status).toBe(404);
    const m = await r.call('/metrics', { token: 'operator-token' });
    expect(m.status).toBe(200);
    expect(m.headers.get('content-type')).toBe('text/plain; version=0.0.4; charset=utf-8');
    const text = await m.text();
    expect(text).toContain('# TYPE classrup_command_total counter');
    expect(text).toContain('classrup_command_total{module="F99.S01.M01",outcome="ok",code="OK"} 1');
    expect(text).not.toMatch(/did:key/);
  });
});
