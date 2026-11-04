import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { createFakeClock } from '../clock/clock.ts';
import { AppErrorException } from '../errors/app-error.ts';
import { ok } from '../errors/result.ts';
import type { EventEnvelope } from '../events/envelope.ts';
import { createDeterministicIds } from '../ids/uuidv7.ts';
import { createIndexedDbDriver, openIndexedDbStorage, VAULT_DB_VERSION, type VaultLocks } from './indexeddb.ts';
import { defineRepo } from './repo.ts';
import { writeScope } from './scope.ts';
import { createStorage } from './storage.ts';
import type { Tx } from './tx.ts';

const clock = createFakeClock('2026-11-04T10:00:00.000Z');
const ids = createDeterministicIds({ seed: 5, now: () => clock.now() });
const draft = defineRepo({ type: 'test.draft', schema: z.strictObject({ title: z.string() }) });
const repo = (tx: Tx) => writeScope({ tx, tenantId: 'vault-1', clock, ids, deliveryEligible: false }).repo(draft);

const DAY = 86_400_000;
const event = (eventId: string): EventEnvelope => ({ eventId, type: 'test.draft.saved', version: 1, tenantId: 'vault-1', aggregate: { type: 'draft', id: 'd1' }, revision: 1, actor: { kind: 'user', id: 'u' }, occurredAt: clock.iso(), correlationId: 'c', causationId: 'c', privacy: 'P3', payload: {}, provenance: { origin: 'vault', sig: null } });

/** Exclusive, ifAvailable-only lock manager with Web Locks semantics (Node 22 has no navigator.locks). */
function fakeLocks(): VaultLocks {
  const held = new Set<string>();
  return {
    request: async (name, _options, callback) => {
      if (held.has(name)) return callback(null);
      held.add(name);
      try {
        return await callback({ name });
      } finally {
        held.delete(name);
      }
    },
  };
}

function failure(p: Promise<unknown>): Promise<unknown> {
  return p.then(
    () => 'resolved',
    (e: unknown) => (e instanceof AppErrorException ? e.error : e),
  );
}

function storeCount(db: IDBDatabase, store: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const r = db.transaction([store], 'readonly').objectStore(store).count();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function rawOpen(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = factory.open(name, VAULT_DB_VERSION);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

describe('IndexedDB vault adapter (PS-119)', () => {
  it('TEST-PS-119-09.T08 commits persist across reopen; a failed IndexedDB commit restores the working set to the last commit', async () => {
    const factory = new IDBFactory();
    const s1 = await openIndexedDbStorage({ name: 'vault-a', indexedDB: factory, clock });
    await s1.transaction((tx) => repo(tx).put('d1', { title: 'first' }, { expectedRevision: 0 }));
    await s1.transaction((tx) => ok(tx.outbox.append({ eventId: 'e1', type: 'test.draft.saved', version: 1, tenantId: 'vault-1', aggregate: { type: 'draft', id: 'd1' }, revision: 1, actor: { kind: 'user', id: 'u' }, occurredAt: clock.iso(), correlationId: 'c', causationId: 'c', privacy: 'P3', payload: {}, provenance: { origin: 'vault', sig: null } })));
    await s1.close();
    const s2 = await openIndexedDbStorage({ name: 'vault-a', indexedDB: factory, clock });
    expect(await s2.read((tx) => repo(tx).get('d1')?.data)).toEqual({ title: 'first' });
    const seq = await s2.transaction((tx) => {
      const e1 = tx.outbox.get('e1');
      if (!e1) throw new Error('e1 missing after reopen');
      return ok(tx.outbox.append({ ...e1, eventId: 'e2' }));
    });
    expect(seq.ok && seq.value).toBe(2);
    await s2.close();

    const db = await rawOpen(factory, 'vault-a');
    let fail = true;
    const flaky = new Proxy(db, {
      get(target, prop) {
        if (prop === 'transaction') {
          return (stores: string[], mode: IDBTransactionMode) => {
            if (fail && mode === 'readwrite') throw new DOMException('quota exceeded', 'QuotaExceededError');
            return target.transaction(stores, mode);
          };
        }
        const v = Reflect.get(target, prop) as unknown;
        return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(target) : v;
      },
    });
    const s3 = createStorage(createIndexedDbDriver(flaky, {}));
    await expect(s3.transaction((tx) => repo(tx).put('d2', { title: 'lost' }, { expectedRevision: 0 }))).rejects.toThrow('quota');
    expect(await s3.read((tx) => repo(tx).get('d2'))).toBeUndefined();
    fail = false;
    expect((await s3.transaction((tx) => repo(tx).put('d3', { title: 'kept' }, { expectedRevision: 0 }))).ok).toBe(true);
    await s3.close();
    const s4 = await openIndexedDbStorage({ name: 'vault-a', indexedDB: factory, clock });
    expect(await s4.read((tx) => [repo(tx).get('d1')?.revision, repo(tx).get('d2'), repo(tx).get('d3')?.data])).toEqual([1, undefined, { title: 'kept' }]);
    await s4.close();
  });

  it('TEST-PS-119-09.T08 one tab owns a vault: a second open while the vault lock is held fails with DEPENDENCY_UNAVAILABLE', async () => {
    const factory = new IDBFactory();
    const locks = fakeLocks();
    const first = await openIndexedDbStorage({ name: 'vault-l', indexedDB: factory, locks, clock });
    expect(await failure(openIndexedDbStorage({ name: 'vault-l', indexedDB: factory, locks, clock }))).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE', retryable: true, params: { dependency: 'storage', reason: 'vault_locked' } });
    const other = await openIndexedDbStorage({ name: 'vault-other', indexedDB: factory, locks, clock });
    await other.close();
    expect((await first.transaction((tx) => repo(tx).put('d1', { title: 'first tab' }, { expectedRevision: 0 }))).ok).toBe(true);
    await first.close();
    const next = await openIndexedDbStorage({ name: 'vault-l', indexedDB: factory, locks, clock });
    expect(await next.read((tx) => repo(tx).get('d1')?.data)).toEqual({ title: 'first tab' });
    await next.close();
  });

  it('TEST-PS-119-09.T08 without an exclusive lock the newest connection owns the vault: an older one cannot commit and keeps its last committed state', async () => {
    const factory = new IDBFactory();
    const grantsEveryone: VaultLocks = { request: (_name, _options, callback) => callback({}) };
    const a = await openIndexedDbStorage({ name: 'vault-f', indexedDB: factory, locks: grantsEveryone, clock });
    await a.transaction((tx) => repo(tx).put('d1', { title: 'a1' }, { expectedRevision: 0 }));
    expect((await a.transaction((tx) => ok(tx.outbox.append(event('e1'))))).ok).toBe(true);
    const b = await openIndexedDbStorage({ name: 'vault-f', indexedDB: factory, locks: grantsEveryone, clock });
    expect(await failure(a.transaction((tx) => repo(tx).put('d1', { title: 'from a' }, { expectedRevision: 1 })))).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE', params: { reason: 'vault_superseded' } });
    expect(await failure(a.transaction((tx) => ok(tx.outbox.append(event('e2-a')))))).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
    expect(await a.read((tx) => [repo(tx).get('d1')?.revision, repo(tx).get('d1')?.data, tx.outbox.get('e2-a')])).toEqual([1, { title: 'a1' }, undefined]);
    expect((await b.transaction((tx) => repo(tx).put('d1', { title: 'from b' }, { expectedRevision: 1 }))).ok).toBe(true);
    const seqB = await b.transaction((tx) => ok(tx.outbox.append(event('e2-b'))));
    expect(seqB.ok && seqB.value).toBe(2);
    await a.close();
    await b.close();
    const c = await openIndexedDbStorage({ name: 'vault-f', indexedDB: factory, locks: fakeLocks(), clock });
    expect(await c.read((tx) => [repo(tx).get('d1')?.revision, repo(tx).get('d1')?.data, tx.outbox.get('e2-a'), tx.outbox.get('e2-b')?.eventId])).toEqual([2, { title: 'from b' }, undefined, 'e2-b']);
    const seqC = await c.transaction((tx) => ok(tx.outbox.append(event('e3'))));
    expect(seqC.ok && seqC.value).toBe(3);
    await c.close();
  });

  it('TEST-PS-119-09.T09 opening a vault runs the retention sweep for expired idempotency rows, old outbox events with their inbox rows and old dead letters', async () => {
    const factory = new IDBFactory();
    const c = createFakeClock('2026-11-04T10:00:00.000Z');
    const s1 = await openIndexedDbStorage({ name: 'vault-r', indexedDB: factory, clock: c });
    await s1.transaction((tx) => {
      tx.idempotency.save({ tenant: 'vault-1', actor: 'u', command: 'test.draft.save', key: 'k1', requestHash: 'h', status: 200, response: { title: 'private' }, createdAt: c.iso(), expiresAt: new Date(c.now() + DAY).toISOString() });
      tx.outbox.append(event('e1'));
      tx.outbox.append(event('e2'));
      tx.inbox.markDone({ consumer: 'c1', envelope: event('e1'), now: c.now() }, 1);
      tx.inbox.markDead({ consumer: 'c1', envelope: event('e2'), now: c.now() }, 8, 'INTERNAL');
      return ok(undefined);
    });
    await s1.close();
    c.advance(8 * DAY);
    const s2 = await openIndexedDbStorage({ name: 'vault-r', indexedDB: factory, clock: c });
    expect(await s2.read((tx) => [tx.outbox.get('e1'), tx.inbox.get('c1', 'e1'), tx.outbox.get('e2')?.eventId, tx.deadLetters.list(undefined).length])).toEqual([undefined, undefined, 'e2', 1]);
    await s2.close();
    const raw = await rawOpen(factory, 'vault-r');
    expect([await storeCount(raw, 'idempotency'), await storeCount(raw, 'outbox'), await storeCount(raw, 'inbox'), await storeCount(raw, 'dead_letter')]).toEqual([0, 1, 1, 1]);
    raw.close();
    c.advance(23 * DAY);
    const s3 = await openIndexedDbStorage({ name: 'vault-r', indexedDB: factory, clock: c });
    expect(await s3.read((tx) => [tx.outbox.get('e2'), tx.inbox.get('c1', 'e2'), tx.deadLetters.list(undefined).length])).toEqual([undefined, undefined, 0]);
    await s3.close();
  });
});
