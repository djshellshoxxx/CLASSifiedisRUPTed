import { describe, expect, it } from 'vitest';
import { createFakeClock, createMemoryStorage, createMemoryDriver, createStorage, ok,
  type AppError, type Result } from '@classrup/kernel';
import { createLocalIntentStore, MAX_LOCAL_INTENTS, privateIntentBackupCodecs, privateIntentCriteriaSchema,
  privateIntentRepo, type LocalIntentStoreOptions, type PrivateIntent } from './index.ts';

const OWNER = 'did:key:owner';
const OTHER = 'did:key:other';
const EXPIRY = '2026-11-05T10:00:00.000Z';
const ID = '00000000-0000-4000-8000-000000000001';
const input = { criteria: { query: 'private-canary' }, expiresAt: EXPIRY };
function value<T>(result: Result<T, AppError>): T { if (!result.ok) throw new Error(result.error.code); return result.value; }
function setup(overrides: Partial<LocalIntentStoreOptions> = {}) {
  const clock = createFakeClock();
  const storage = overrides.storage ?? createMemoryStorage();
  let serial = 0;
  const store = createLocalIntentStore({ storage, principal: OWNER, clock, enabled: true,
    isCurrent: () => true, randomId: () => `00000000-0000-4000-8000-${(++serial).toString(16).padStart(12, '0')}`, ...overrides });
  return { clock, storage, store };
}

describe('private local intent admission', () => {
  it('uses closed, bounded criteria with exact canonical prices', () => {
    expect(privateIntentCriteriaSchema.parse({})).toEqual({ query: '' });
    expect(privateIntentCriteriaSchema.parse({ price: { currency: 'USD', min: '9', max: '10' } }).price).toEqual({ currency: 'USD', min: '9', max: '10' });
    expect(privateIntentCriteriaSchema.safeParse({ price: { currency: 'USD', min: '9'.repeat(78), max: '9'.repeat(78) } }).success).toBe(true);
    for (const criteria of [
      { query: 'x'.repeat(121) }, { query: 'hidden\u0000text' }, { query: 'concealed\u202etext' }, { query: 'e\u0301' },
      { categoryId: 'private-name' }, { remoteProvider: 'other' }, { regionCell: 'u4pruy' },
      { price: { currency: 'usd' } }, { price: { currency: 'USD', min: '-1' } }, { price: { currency: 'USD', min: '01' } },
      { price: { currency: 'USD', max: '1e3' } }, { price: { currency: 'USD', max: '0.1' } },
      { price: { currency: 'USD', max: '1'.repeat(79) } }, { price: { currency: 'USD', min: '10', max: '9' } },
      { price: { currency: 'USD', min: '11', max: '10' } }, { price: { currency: 'USD', amount: '1' } },
    ]) expect(privateIntentCriteriaSchema.safeParse(criteria).success).toBe(false);
  });

  it('is disabled by default and rejects caller-chosen identifiers and authority fields', async () => {
    const { store, storage } = setup({ enabled: undefined });
    expect(await store.create(input)).toMatchObject({ ok: false, error: { code: 'FEATURE_DISABLED' } });
    expect(await store.list()).toEqual(ok([]));
    expect(await storage.read(tx => tx.records.query({ tenant: OWNER, type: privateIntentRepo.type, filters: [], orderSlot: 0, dir: 'asc', limit: 1 }).length)).toBe(0);
    const enabled = setup().store;
    for (const extra of [{ id: ID }, { intentId: ID }, { ownerId: OTHER }, { state: 'active' }, { expiresAt: '2026-11-05' }]) {
      expect(await enabled.create({ ...input, ...extra })).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    }
  });

  it('creates detached draft rows and rejects identifier collisions', async () => {
    const { store } = setup({ randomId: () => ID });
    const row = value(await store.create(input));
    expect(row).toMatchObject({ id: ID, revision: 1, data: { intentId: ID, ownerId: OWNER, state: 'draft', ...input } });
    row.data.criteria.query = 'modified caller copy';
    expect(value(await store.read(ID)).data.criteria.query).toBe('private-canary');
    expect(await store.create(input)).toMatchObject({ ok: false, error: { code: 'CONFLICT_REVISION' } });
    expect(value(await store.list())).toHaveLength(1);
    expect(await setup({ randomId: () => 'name-or-timestamp' }).store.create(input)).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
  });

  it('rejects foreign owners, malformed stored ownership and absent rows', async () => {
    const { store, storage, clock } = setup();
    const row = value(await store.create(input));
    const other = createLocalIntentStore({ storage, principal: OTHER, clock, enabled: true, isCurrent: () => true });
    expect(await other.read(row.id)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
    expect(await other.erase({ id: row.id, expectedRevision: 1 })).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
    expect(await other.list()).toEqual(ok([]));
    await storage.transaction(tx => tx.records.put({ tenant: OWNER, type: privateIntentRepo.type, id: row.id,
      data: { ...row.data, ownerId: OTHER }, idx: [OWNER, null, null, null], expectedRevision: 1, now: clock.now() }));
    expect(await store.read(row.id)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
    expect(await store.erase({ id: row.id, expectedRevision: 2 })).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
  });

  it('uses optimistic revisions and resets edited intents to draft', async () => {
    const { store } = setup();
    const created = value(await store.create(input));
    const active = value(await store.setState({ id: created.id, expectedRevision: 1, state: 'active' }));
    expect(active).toMatchObject({ revision: 2, data: { state: 'active' } });
    expect(await store.revise({ id: created.id, expectedRevision: 1, ...input })).toMatchObject({ ok: false, error: { code: 'CONFLICT_REVISION' } });
    const revised = value(await store.revise({ id: created.id, expectedRevision: 2, ...input, criteria: { query: 'new criteria' } }));
    expect(revised).toMatchObject({ revision: 3, data: { state: 'draft', criteria: { query: 'new criteria' } } });
    expect(await store.erase({ id: created.id, expectedRevision: 2 })).toMatchObject({ ok: false, error: { code: 'CONFLICT_REVISION' } });
    for (const expectedRevision of [0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
      expect(await store.erase({ id: created.id, expectedRevision })).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    }
  });

  it('enforces expiry for creation and activation while preserving expired cleanup', async () => {
    const { store, clock } = setup();
    expect(await store.create({ ...input, expiresAt: clock.iso() })).toMatchObject({ ok: false, error: { code: 'EXPIRED' } });
    const row = value(await store.create(input));
    clock.set(EXPIRY);
    expect(await store.setState({ id: row.id, expectedRevision: 1, state: 'active' })).toMatchObject({ ok: false, error: { code: 'EXPIRED' } });
    expect(value(await store.read(row.id)).id).toBe(row.id);
    const paused = value(await store.setState({ id: row.id, expectedRevision: 1, state: 'paused' }));
    expect(await store.erase({ id: row.id, expectedRevision: paused.revision })).toEqual(ok(undefined));
    clock.set(Number.NaN);
    expect(await store.list()).toMatchObject({ ok: false, error: { code: 'PRECONDITION_FAILED' } });
  });

  it('bounds live intents without silently truncating, and erasure frees capacity', async () => {
    const { store } = setup();
    for (let i = 0; i < MAX_LOCAL_INTENTS; i++) value(await store.create(input));
    const rows = value(await store.list());
    expect(rows).toHaveLength(MAX_LOCAL_INTENTS);
    expect(await store.create(input)).toMatchObject({ ok: false, error: { code: 'PRECONDITION_FAILED' } });
    value(await store.erase({ id: rows[0]!.id, expectedRevision: 1 }));
    value(await store.create(input));
    expect(value(await store.list())).toHaveLength(MAX_LOCAL_INTENTS);
  });
});

describe('strict local intent erasure and session guards', () => {
  it('removes the entire persisted row without an outbox, hash, idempotency entry or deletion log', async () => {
    const durable = new Map<string, unknown>();
    const storage = createStorage(createMemoryDriver({ async persist(changes) {
      for (const change of changes) {
        const key = `${change.table}/${change.key}`;
        if (change.row === undefined) durable.delete(key); else durable.set(key, structuredClone(change.row));
      }
    } }));
    const { store } = setup({ storage });
    const row = value(await store.create(input));
    expect(durable.size).toBe(1);
    expect(JSON.stringify([...durable])).toContain('private-canary');
    const epoch = store.epoch();
    value(await store.erase({ id: row.id, expectedRevision: 1 }));
    expect(store.epoch()).not.toBe(epoch);
    expect(durable.size).toBe(0);
    expect(await store.read(row.id)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
    expect(await store.erase({ id: row.id, expectedRevision: 1 })).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
    expect(durable.size).toBe(0);
  });

  it('allows read, pause and erasure after disabling the feature', async () => {
    const { store, clock, storage } = setup();
    const row = value(await store.create(input));
    const disabled = createLocalIntentStore({ storage, principal: OWNER, clock, isCurrent: () => true });
    expect(value(await disabled.list())).toHaveLength(1);
    expect(value(await disabled.read(row.id)).id).toBe(row.id);
    expect(await disabled.setState({ id: row.id, expectedRevision: 1, state: 'active' })).toMatchObject({ ok: false, error: { code: 'FEATURE_DISABLED' } });
    expect(await disabled.revise({ id: row.id, expectedRevision: 1, ...input })).toMatchObject({ ok: false, error: { code: 'FEATURE_DISABLED' } });
    const paused = value(await disabled.setState({ id: row.id, expectedRevision: 1, state: 'paused' }));
    expect(await disabled.erase({ id: row.id, expectedRevision: paused.revision })).toEqual(ok(undefined));
  });

  it('rolls back failed erasure and returns only a fixed error without restoring pending matching authority', async () => {
    let fail = false;
    const { store } = setup({ storage: createStorage(createMemoryDriver({ async persist() { if (fail) throw new Error('private persisted error canary'); } })) });
    const row = value(await store.create(input));
    const epoch = store.epoch();
    fail = true;
    const result = await store.erase({ id: row.id, expectedRevision: 1 });
    expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
    expect(JSON.stringify(result)).not.toContain('canary');
    expect(store.epoch()).not.toBe(epoch);
    expect(value(await store.read(row.id))).toEqual(row);
    fail = false;
    value(await store.erase({ id: row.id, expectedRevision: 1 }));
  });

  it('checks the session again when a queued write actually starts', async () => {
    let current = true;
    const { store, storage } = setup({ isCurrent: () => current });
    let release!: () => void;
    let entered!: () => void;
    const ready = new Promise<void>(resolve => { entered = resolve; });
    const blocker = new Promise<void>(resolve => { release = resolve; });
    const holding = storage.transaction(async () => { entered(); await blocker; return ok(undefined); });
    await ready;
    const pending = store.create(input);
    current = false;
    release();
    await holding;
    expect(await pending).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(await storage.read(tx => tx.records.query({ tenant: OWNER, type: privateIntentRepo.type, filters: [], orderSlot: 0, dir: 'asc', limit: 1 }).length)).toBe(0);
    current = true;
    expect(await store.list()).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  });

  it('does not return a completed write payload after the session is lost during persistence', async () => {
    let current = true;
    let release!: () => void;
    let entered!: () => void;
    const ready = new Promise<void>(resolve => { entered = resolve; });
    const blocker = new Promise<void>(resolve => { release = resolve; });
    const storage = createStorage(createMemoryDriver({ async persist() { entered(); await blocker; } }));
    const { store } = setup({ storage, isCurrent: () => current });
    const pending = store.create(input);
    await ready;
    current = false;
    release();
    const result = await pending;
    expect(result).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(result).not.toHaveProperty('value');
    expect(JSON.stringify(result)).not.toContain('private-canary');
  });

  it('invalidates pending work on edit, pause and erase, while reading preserves the epoch', async () => {
    const { store } = setup();
    let row = value(await store.create(input));
    let epoch = store.epoch();
    value(await store.read(row.id)); value(await store.list());
    expect(store.epoch()).toBe(epoch);
    row = value(await store.revise({ id: row.id, expectedRevision: row.revision, ...input }));
    expect(store.epoch()).not.toBe(epoch); epoch = store.epoch();
    row = value(await store.setState({ id: row.id, expectedRevision: row.revision, state: 'paused' }));
    expect(store.epoch()).not.toBe(epoch); epoch = store.epoch();
    value(await store.erase({ id: row.id, expectedRevision: row.revision }));
    expect(store.epoch()).not.toBe(epoch);
  });

  it('keeps private criteria out of errors from throwing runtime inputs', async () => {
    const { store } = setup();
    const secret = { get criteria() { throw new Error('private getter canary'); }, expiresAt: EXPIRY };
    expect(await store.create(secret)).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    expect(await setup({ isCurrent: () => { throw new Error('private session canary'); } }).store.list()).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  });
});

describe('private intent backup contract', () => {
  it('binds owner and opaque record ID and resets restored content to draft', async () => {
    const { store } = setup();
    const row = value(await store.create(input));
    const active = value(await store.setState({ id: row.id, expectedRevision: 1, state: 'active' }));
    const [codec] = privateIntentBackupCodecs(repo => ({ type: repo.type, parse: data => repo.schema.parse(data),
      indexes: () => [null, null, null, null] }));
    expect(codec!.recordId!(active.data)).toBe(row.id);
    const restored = await codec!.restoreData!(active.data, OWNER) as PrivateIntent;
    expect(restored.state).toBe('draft');
    expect(restored.criteria).toEqual(active.data.criteria);
    expect(active.data.state).toBe('active');
    await expect(codec!.restoreData!(active.data, OTHER)).rejects.toThrow('another principal');
    expect(() => codec!.parse({ ...active.data, intentId: 'user-identifying-key' })).toThrow();
    expect(() => codec!.parse({ ...active.data, authorization: 'stale' })).toThrow();
  });
});
