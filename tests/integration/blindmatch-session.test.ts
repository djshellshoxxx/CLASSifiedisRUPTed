import { describe, expect, it, vi } from 'vitest';
import { createFakeClock, createMemoryDriver, createStorage, type AppError, type Result } from '../../packages/kernel/src/index.ts';
import { publicListingSchema, type RetainedListing } from '../../packages/discovery/src/index.ts';
import { createLocalIntentStore, createLocalMatchSession,
  type LocalCandidateRequest, type LocalIntentStore, type LocalMatchSessionOptions } from '../../packages/blindmatch/src/index.ts';

const NOW = Date.UTC(2026, 10, 26, 12);
const OWNER = 'did:key:local-owner';
const PEER = 'did:key:public-peer';
const INTENT_ID = '00000000-0000-4000-8000-000000000001';
const LISTING_ID = '0195aaaa-0000-7000-8000-000000000001';
const EXPIRY = new Date(NOW + 60_000).toISOString();
const content = { criteria: { query: 'private-canary', price: { currency: 'CAD', max: '9007199254740993' } }, expiresAt: EXPIRY };
function value<T>(result: Result<T, AppError>): T { if (!result.ok) throw new Error(result.error.code); return result.value; }
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => { resolve = accept; });
  return { promise, resolve };
}
/** A synthetic output from the verified public-cache boundary, not cryptographic verification. */
function candidate(expiresAt = EXPIRY): RetainedListing {
  const projection = publicListingSchema.parse({ listingId: LISTING_ID, ownerId: PEER, revision: 1,
    kind: 'sell', title: 'Private-canary bicycle', description: 'Synthetic public description',
    categoryId: '0195aaaa-0000-7000-8000-000000000002', condition: 'good', tags: ['bicycle'],
    locale: 'en', regionCell: 'u4pru', barterOptIn: false, availability: 'available',
    value: { currency: 'CAD', amount: '100' }, expiresAt });
  return { ownerId: PEER, listingId: LISTING_ID, remoteRevision: 1, cid: 'synthetic-public-cid', projection,
    envelopes: [{ syntheticFixture: true }], evidenceCids: ['synthetic-public-cid'],
    observedAt: new Date(NOW - 1000).toISOString(), conflicted: false };
}
const refs = [{ ownerId: PEER, listingId: LISTING_ID, revision: 1, cid: 'synthetic-public-cid' }];

async function setup() {
  const clock = createFakeClock(NOW), durable = new Map<string, unknown>();
  const storage = createStorage(createMemoryDriver({ async persist(changes) {
    for (const change of changes) {
      const key = `${change.table}/${change.key}`;
      if (change.row === undefined) durable.delete(key); else durable.set(key, structuredClone(change.row));
    }
  } }));
  let current = true;
  const isCurrent = () => current;
  const store = createLocalIntentStore({ storage, principal: OWNER, clock, isCurrent, enabled: true, randomId: () => INTENT_ID });
  const created = value(await store.create(content));
  const active = value(await store.setState({ id: created.id, expectedRevision: created.revision, state: 'active' }));
  const request = { id: active.id, expectedRevision: active.revision };
  const session = (overrides: Partial<LocalMatchSessionOptions> = {}) => createLocalMatchSession({
    intents: store, principal: OWNER, clock, isCurrent, enabled: true,
    loadCandidates: async () => [candidate()], ...overrides,
  });
  return { clock, storage, durable, store, active, request, isCurrent, session, lock: () => { current = false; } };
}

describe('private local matching session composition', () => {
  it('defaults disabled, refuses confidential modes and performs no candidate load', async () => {
    const h = await setup(), loader = vi.fn(async (_request: LocalCandidateRequest) => [candidate()]);
    const disabled = createLocalMatchSession({ intents: h.store, principal: OWNER, clock: h.clock,
      isCurrent: h.isCurrent, loadCandidates: loader });
    expect(await disabled.match(h.request)).toMatchObject({ ok: false, error: { code: 'FEATURE_DISABLED' } });
    const enabled = h.session({ loadCandidates: loader });
    for (const mode of ['bilateral-confidential', 'advanced-confidential']) {
      expect(await enabled.match({ ...h.request, mode })).toMatchObject({ ok: false, error: { code: 'DEPENDENCY_UNAVAILABLE' } });
    }
    expect(loader).not.toHaveBeenCalled();
  });

  it('requires literal true enablement and rejects truthy malformed configuration before reads or loads', async () => {
    const h = await setup(), loader = vi.fn(async () => [candidate()]);
    const read = vi.spyOn(h.store, 'read');
    for (const enabled of ['false', {}, 1]) {
      const session = h.session({ enabled: enabled as unknown as boolean, loadCandidates: loader });
      expect(await session.match(h.request)).toMatchObject({ ok: false, error: { code: 'FEATURE_DISABLED' } });
    }
    expect(read).not.toHaveBeenCalled();
    expect(loader).not.toHaveBeenCalled();
  });

  it('loads with only a fixed limit and cancellation signal, returns public references and persists nothing', async () => {
    const h = await setup(), loader = vi.fn(async (_request: LocalCandidateRequest) => [candidate()]);
    const network = vi.spyOn(globalThis, 'fetch');
    const log = vi.spyOn(console, 'log'), warn = vi.spyOn(console, 'warn'), error = vi.spyOn(console, 'error');
    const before = value(await h.store.read(INTENT_ID)), beforePersistence = structuredClone([...h.durable]);
    try {
      const result = await h.session({ loadCandidates: loader }).match(h.request);
      expect(result).toEqual({ ok: true, value: { mode: 'local', intentRevision: 2, items: refs } });
      expect(loader).toHaveBeenCalledTimes(1);
      const args = loader.mock.calls[0]!;
      expect(args).toHaveLength(1);
      expect(Object.keys(args[0]!).sort()).toEqual(['limit', 'signal']);
      expect(args[0]).toMatchObject({ limit: 128, signal: expect.any(AbortSignal) });
      expect(JSON.stringify(args)).not.toMatch(/private-canary|9007199254740993|00000000-0000-4000-8000-000000000001/);
      expect(JSON.stringify(result)).not.toMatch(/private-canary|9007199254740993|criteria|reason|score/);
      expect(value(await h.store.read(INTENT_ID))).toEqual(before);
      expect([...h.durable]).toEqual(beforePersistence);
      expect(await h.storage.read(tx => tx.sync.list({}))).toEqual([]);
      expect(network).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled(); expect(warn).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
    } finally { network.mockRestore(); log.mockRestore(); warn.mockRestore(); error.mockRestore(); }
  });

  it('requires an owned active, current revision before loading candidates', async () => {
    const h = await setup(), loader = vi.fn(async () => [candidate()]);
    const session = h.session({ loadCandidates: loader });
    expect(await session.match({ ...h.request, expectedRevision: 1 })).toMatchObject({ ok: false, error: { code: 'CONFLICT_REVISION' } });
    const other = h.session({ principal: 'did:key:other', loadCandidates: loader });
    expect(await other.match(h.request)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    const paused = value(await h.store.setState({ ...h.request, state: 'paused' }));
    expect(await session.match({ id: paused.id, expectedRevision: paused.revision })).toMatchObject({ ok: false, error: { code: 'PRECONDITION_FAILED' } });
    expect(loader).not.toHaveBeenCalled();
  });

  it.each(['lock', 'pause', 'erase', 'revise', 'expire'] as const)('rejects a candidate result delayed past %s', async action => {
    const h = await setup(), ready = deferred<void>(), loaded = deferred<readonly unknown[]>();
    const session = h.session({ loadCandidates: async () => { ready.resolve(); return loaded.promise; } });
    const pending = session.match(h.request);
    await ready.promise;
    if (action === 'lock') h.lock();
    if (action === 'pause') value(await h.store.setState({ ...h.request, state: 'paused' }));
    if (action === 'erase') value(await h.store.erase(h.request));
    if (action === 'revise') value(await h.store.revise({ ...h.request, ...content, criteria: { query: 'changed' } }));
    if (action === 'expire') h.clock.set(EXPIRY);
    loaded.resolve([candidate()]);
    const result = await pending;
    expect(result).toMatchObject({ ok: false, error: { code: action === 'expire' ? 'EXPIRED' : 'PRECONDITION_FAILED' } });
    expect(result).not.toHaveProperty('value');
  });

  it('rereads the durable revision after a second store changes the same intent', async () => {
    const h = await setup(), ready = deferred<void>(), loaded = deferred<readonly unknown[]>();
    const session = h.session({ loadCandidates: async () => { ready.resolve(); return loaded.promise; } });
    const pending = session.match(h.request);
    await ready.promise;
    const second = createLocalIntentStore({ storage: h.storage, principal: OWNER, clock: h.clock, isCurrent: h.isCurrent, enabled: true });
    const revised = value(await second.revise({ ...h.request, ...content, criteria: { query: 'other criteria' } }));
    value(await second.setState({ id: revised.id, expectedRevision: revised.revision, state: 'active' }));
    loaded.resolve([candidate()]);
    expect(await pending).toMatchObject({ ok: false, error: { code: 'CONFLICT_REVISION' } });
  });

  it('settles cancellation even when the candidate adapter never resolves or honors abort', async () => {
    const h = await setup(), ready = deferred<void>();
    let observed: AbortSignal | undefined;
    const session = h.session({ loadCandidates: async request => { observed = request.signal; ready.resolve(); return new Promise(() => undefined); } });
    const pending = session.match(h.request);
    await ready.promise;
    session.cancel();
    expect(await pending).toMatchObject({ ok: false, error: { code: 'PRECONDITION_FAILED' } });
    expect(observed?.aborted).toBe(true);
  });

  it.each([1, 2])('settles cancellation during intent read %s without awaiting that read or releasing late results', async heldRead => {
    const h = await setup(), ready = deferred<void>(), release = deferred<void>();
    let reads = 0;
    const delayed: LocalIntentStore = { ...h.store, async read(id) {
      const result = await h.store.read(id);
      if (++reads === heldRead) { ready.resolve(); await release.promise; }
      return result;
    } };
    const loader = vi.fn(async () => [candidate()]);
    const session = h.session({ intents: delayed, loadCandidates: loader });
    const pending = session.match(h.request);
    await ready.promise;
    session.cancel();
    try {
      // Cancellation is locally settled in microtasks; the underlying read remains deliberately held.
      const settled = await Promise.race([pending, new Promise<'still-pending'>(resolve => setTimeout(() => resolve('still-pending'), 0))]);
      expect(settled).toMatchObject({ ok: false, error: { code: 'PRECONDITION_FAILED' } });
      expect(settled).not.toHaveProperty('value');
      expect(loader).toHaveBeenCalledTimes(heldRead - 1);
    } finally { release.resolve(); }
    expect(await pending).toMatchObject({ ok: false, error: { code: 'PRECONDITION_FAILED' } });
    // A late completion of the cancelled read cannot prevent a fresh explicit request.
    expect(await session.match(h.request)).toEqual({ ok: true, value: { mode: 'local', intentRevision: 2, items: refs } });
    expect(loader).toHaveBeenCalledTimes(heldRead);
  });

  it('honors pre-existing and in-flight caller AbortSignals without waiting for the adapter', async () => {
    const h = await setup(), ready = deferred<void>();
    const loader = vi.fn(async () => { ready.resolve(); return new Promise<readonly unknown[]>(() => undefined); });
    const session = h.session({ loadCandidates: loader });
    const early = new AbortController(); early.abort('private abort reason');
    expect(await session.match(h.request, { signal: early.signal })).toMatchObject({ ok: false, error: { code: 'PRECONDITION_FAILED' } });
    expect(loader).not.toHaveBeenCalled();
    const later = new AbortController();
    const pending = session.match(h.request, { signal: later.signal });
    await ready.promise;
    later.abort('private abort reason');
    const result = await pending;
    expect(result).toMatchObject({ ok: false, error: { code: 'PRECONDITION_FAILED' } });
    expect(JSON.stringify(result)).not.toContain('private abort reason');
  });

  it('supersedes a stuck request and lets only the current request return', async () => {
    const h = await setup(), ready = deferred<void>();
    let calls = 0;
    const session = h.session({ loadCandidates: async () => {
      if (++calls === 1) { ready.resolve(); return new Promise(() => undefined); }
      return [candidate()];
    } });
    const first = session.match(h.request);
    await ready.promise;
    const second = session.match(h.request);
    expect(await first).toMatchObject({ ok: false, error: { code: 'PRECONDITION_FAILED' } });
    expect(await second).toEqual({ ok: true, value: { mode: 'local', intentRevision: 2, items: refs } });
    expect(calls).toBe(2);
  });

  it('contains malformed request getters, adapter errors and policy exceptions', async () => {
    const h = await setup(), loader = vi.fn(async () => [candidate()]);
    const bad = { get id() { throw new Error('private getter canary'); }, expectedRevision: 2 };
    const malformed = await h.session({ loadCandidates: loader }).match(bad);
    expect(malformed).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    expect(loader).not.toHaveBeenCalled();
    const unavailable = await h.session({ loadCandidates: async () => { throw new Error('private adapter canary'); } }).match(h.request);
    expect(unavailable).toMatchObject({ ok: false, error: { code: 'DEPENDENCY_UNAVAILABLE' } });
    const failedPolicy = await h.session({ blockedOwners: () => { throw new Error('private policy canary'); } }).match(h.request);
    expect(failedPolicy).toMatchObject({ ok: false, error: { code: 'DEPENDENCY_UNAVAILABLE' } });
    expect(JSON.stringify([malformed, unavailable, failedPolicy])).not.toContain('canary');
  });

  it.each(['candidate-expiry', 'block'] as const)('applies %s that changes during the final awaited read', async change => {
    const h = await setup(), finalRead = deferred<void>(), release = deferred<void>();
    let reads = 0, blocked: readonly string[] = [];
    const delayed: LocalIntentStore = { ...h.store, async read(id) {
      const result = await h.store.read(id);
      if (++reads === 2) { finalRead.resolve(); await release.promise; }
      return result;
    } };
    const session = h.session({ intents: delayed, blockedOwners: () => blocked,
      loadCandidates: async () => [candidate(new Date(NOW + 1000).toISOString())] });
    const pending = session.match(h.request);
    await finalRead.promise;
    if (change === 'candidate-expiry') h.clock.advance(1000);
    else blocked = [PEER];
    release.resolve();
    expect(await pending).toEqual({ ok: true, value: { mode: 'local', intentRevision: 2, items: [] } });
  });
});
