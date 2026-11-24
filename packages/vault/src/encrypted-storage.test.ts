import { IDBFactory, IDBDatabase as FakeDatabase } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { ok, type Tx } from '@classrup/kernel';
import { openIndexedDbStorage } from '@classrup/kernel/browser';
import { createIdentity } from '@classrup/identity';
import { openVault } from './vault.ts';

const passphrase = 'encrypted storage test passphrase';
async function rows(factory: IDBFactory, name: string): Promise<Record<string, unknown[]>> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open(`classrup-vault:${name}`);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    const entries = await Promise.all(Array.from(db.objectStoreNames).map(async table => {
      const values = await new Promise<unknown[]>((resolve, reject) => {
        const request = db.transaction(table).objectStore(table).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
        const request = db.transaction(table).objectStore(table).getAllKeys();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return [[table, values], [`${table}.keys`, keys]];
    }));
    return Object.fromEntries(entries.flat());
  } finally { db.close(); }
}

async function mutate(factory: IDBFactory, name: string, change: (store: IDBObjectStore, keys: IDBValidKey[], values: unknown[]) => void, table = 'records'): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open(`classrup-vault:${name}`);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(table, 'readwrite');
      const store = tx.objectStore(table);
      const keys = store.getAllKeys();
      const values = store.getAll();
      values.onsuccess = () => change(store, keys.result, values.result);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
const put = (tenant: string, id: string, text = 'secret') => ({ tenant, type: 'test.secret', id, data: { text }, idx: [text, null, null, null] as const, expectedRevision: 0, now: Date.now() });

describe('encrypted domain persistence', () => {
  it('revokes retained transaction handles on lock without altering the reopened encrypted vault', async () => {
    const indexedDB = new IDBFactory();
    const vault = await openVault({ name: 'retained-transaction', indexedDB });
    const session = await vault.create(passphrase);
    const principal = session.principal;
    let retained!: Tx;
    await session.storage.transaction(tx => {
      retained = tx;
      return tx.records.put(put(principal, 'saved', 'preserved private record'));
    });
    const read = retained.records.get;
    const write = retained.records.put;
    await session.lock();
    expect(() => read(principal, 'test.secret', 'saved')).toThrow('Transaction is no longer active');
    expect(() => write(put(principal, 'late'))).toThrow('Transaction is no longer active');
    const reopened = await openVault({ name: 'retained-transaction', indexedDB });
    const fresh = await reopened.unlock(passphrase);
    expect(fresh.principal).toBe(principal);
    expect(await fresh.storage.read(tx => tx.records.get(principal, 'test.secret', 'saved')?.data)).toEqual({ text: 'preserved private record' });
    expect(await fresh.storage.read(tx => tx.records.get(principal, 'test.secret', 'late'))).toBeUndefined();
    await fresh.lock();
  }, 30000);

  it('encrypts row contents and indexes, restores them on unlock, and rejects a wrong passphrase without modifying storage', async () => {
    const indexedDB = new IDBFactory();
    const vault = await openVault({ name: 'encrypted', indexedDB });
    const session = await vault.create(passphrase);
    const principal = session.principal;
    await session.storage.transaction(tx => tx.records.put({ tenant: principal, type: 'test.secret', id: 'record-id-private-canary', data: { text: 'private-domain-canary' }, idx: ['secret-index-canary', null, null, null], expectedRevision: 0, now: Date.now() }));
    const persisted = JSON.stringify(await rows(indexedDB, 'encrypted'));
    expect(persisted).not.toContain('private-domain-canary');
    expect(persisted).not.toContain('secret-index-canary');
    expect(persisted).not.toContain('record-id-private-canary');
    await session.lock();
    const reopened = await openVault({ name: 'encrypted', indexedDB });
    await expect(reopened.unlock('incorrect but long passphrase')).rejects.toThrow();
    const unlocked = await reopened.unlock(passphrase);
    expect(await unlocked.storage.read(tx => tx.records.get(principal, 'test.secret', 'record-id-private-canary')?.data)).toEqual({ text: 'private-domain-canary' });
    await unlocked.lock();
  }, 30000);

  it('migrates legacy plaintext only after identity verification and preserves revisions', async () => {
    const indexedDB = new IDBFactory();
    const identity = await createIdentity(passphrase);
    const storage = await openIndexedDbStorage({ name: 'classrup-vault:legacy', indexedDB });
    await storage.transaction(tx => tx.records.put({ tenant: 'local-vault', type: 'vault.identity', id: 'root', data: identity.protectedIdentity, idx: [null, null, null, null], expectedRevision: 0, now: Date.now() }));
    await storage.transaction(tx => tx.records.put({ tenant: identity.identity.principal, type: 'test.secret', id: 'old', data: { text: 'legacy-domain-canary' }, idx: [null, null, null, null], expectedRevision: 0, now: Date.now() }));
    await storage.close();
    identity.identity.lock();
    const vault = await openVault({ name: 'legacy', indexedDB });
    await expect(vault.unlock('incorrect but long passphrase')).rejects.toThrow();
    expect(JSON.stringify(await rows(indexedDB, 'legacy'))).toContain('legacy-domain-canary');
    const session = await vault.unlock(passphrase);
    expect(await session.storage.read(tx => tx.records.get(session.principal, 'test.secret', 'old')?.revision)).toBe(1);
    expect(JSON.stringify(await rows(indexedDB, 'legacy'))).not.toContain('legacy-domain-canary');
    await session.lock();
  }, 30000);
  it.each(['swap', 'ciphertext', 'plaintext'] as const)('rejects %s tampering before exposing a session', async tamper => {
    const indexedDB = new IDBFactory();
    const vault = await openVault({ name: tamper, indexedDB });
    const session = await vault.create(passphrase);
    await session.storage.transaction(tx => { tx.records.put(put(session.principal, 'a')); return tx.records.put(put(session.principal, 'b')); });
    await session.lock();
    await mutate(indexedDB, tamper, (store, keys, values) => {
      const indexes = keys.map((key, index) => String(key).startsWith('local-vault') ? -1 : index).filter(index => index >= 0);
      const a = indexes[0]!;
      const b = indexes[1]!;
      if (tamper === 'swap') { store.put(values[a], keys[b]); store.put(values[b], keys[a]); }
      else if (tamper === 'plaintext') store.put({ data: 'untrusted plaintext' }, keys[a]);
      else {
        const row = values[a] as { ciphertext: string };
        store.put({ ...row, ciphertext: (row.ciphertext[0] === 'A' ? 'B' : 'A') + row.ciphertext.slice(1) }, keys[a]);
      }
    });
    const reopened = await openVault({ name: tamper, indexedDB });
    await expect(reopened.unlock(passphrase)).rejects.toThrow();
    await reopened.close();
  }, 30000);

  it('rolls back a failed encryption without publishing any rows and allows a later write', async () => {
    const indexedDB = new IDBFactory();
    const vault = await openVault({ name: 'rollback', indexedDB });
    const session = await vault.create(passphrase);
    const spy = vi.spyOn(crypto.subtle, 'encrypt').mockRejectedValueOnce(new Error('injected encryption failure'));
    try { await expect(session.storage.transaction(tx => tx.records.put(put(session.principal, 'failed')))).rejects.toThrow('injected encryption failure'); }
    finally { spy.mockRestore(); }
    expect(await session.storage.read(tx => tx.records.get(session.principal, 'test.secret', 'failed'))).toBeUndefined();
    expect((await session.storage.transaction(tx => tx.records.put(put(session.principal, 'kept')))).ok).toBe(true);
    const originalMarker = await session.storage.read(tx => tx.records.incarnation(session.principal, 'test.secret', 'kept'));
    expect(originalMarker).toMatch(/^[A-Za-z0-9_-]{21}[AQgw]$/);
    const persistedBefore = await rows(indexedDB, 'rollback');
    expect(JSON.stringify(persistedBefore)).not.toContain(originalMarker!);
    // Encryption can succeed while opening the durable write transaction fails.
    // A rejected delete/recreate must not publish the replacement incarnation.
    const originalTransaction = FakeDatabase.prototype.transaction;
    const writeFailure = vi.spyOn(FakeDatabase.prototype, 'transaction').mockImplementation(function (this: IDBDatabase, ...args: Parameters<typeof originalTransaction>) {
      if (args[1] === 'readwrite') throw new DOMException('injected durable write failure', 'QuotaExceededError');
      return originalTransaction.apply(this, args);
    });
    try {
      await expect(session.storage.transaction(tx => {
        const removed = tx.records.remove(session.principal, 'test.secret', 'kept', 1);
        if (!removed.ok) throw new Error('Fixture removal failed');
        const recreated = tx.records.put(put(session.principal, 'kept', 'replacement'));
        if (!recreated.ok) throw new Error('Fixture recreation failed');
        expect(tx.records.incarnation(session.principal, 'test.secret', 'kept')).not.toBe(originalMarker);
        return recreated;
      })).rejects.toThrow('injected durable write failure');
    } finally { writeFailure.mockRestore(); }
    expect(await rows(indexedDB, 'rollback')).toEqual(persistedBefore);
    expect(await session.storage.read(tx => tx.records.incarnation(session.principal, 'test.secret', 'kept'))).toBe(originalMarker);
    expect(await session.storage.read(tx => tx.records.get(session.principal, 'test.secret', 'kept')?.data)).toEqual({ text: 'secret' });
    await session.lock();
    const reopened = await openVault({ name: 'rollback', indexedDB });
    const unlocked = await reopened.unlock(passphrase);
    expect(await unlocked.storage.read(tx => tx.records.get(unlocked.principal, 'test.secret', 'failed'))).toBeUndefined();
    expect(await unlocked.storage.read(tx => tx.records.get(unlocked.principal, 'test.secret', 'kept')?.revision)).toBe(1);
    expect(await unlocked.storage.read(tx => tx.records.incarnation(unlocked.principal, 'test.secret', 'failed'))).toBeUndefined();
    expect(await unlocked.storage.read(tx => tx.records.incarnation(unlocked.principal, 'test.secret', 'kept'))).toBe(originalMarker);
    expect(await unlocked.storage.read(tx => tx.records.get(unlocked.principal, 'test.secret', 'kept')?.data)).toEqual({ text: 'secret' });
    await unlocked.lock();
  }, 30000);

  it('persists binary blobs and private delivery/idempotency rows with fresh ciphertext on every write', async () => {
    const indexedDB = new IDBFactory();
    const vault = await openVault({ name: 'all-tables', indexedDB });
    const session = await vault.create(passphrase);
    const tenant = session.principal;
    const bytes = new TextEncoder().encode('blob-private-canary');
    const blob = await session.storage.transaction(tx => tx.blobs.put({ tenant, bytes, contentType: 'application/octet-stream', privacy: 'P3', now: Date.now() }));
    expect(blob.ok).toBe(true);
    if (!blob.ok) throw new Error('Missing blob');
    await session.storage.transaction(tx => {
      tx.idempotency.save({ tenant, actor: 'actor', command: 'test.save', key: 'idempotency-key-private-canary', requestHash: 'hash', status: 200, response: { text: 'response-private-canary' }, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString() });
      const seq = tx.outbox.append({ eventId: 'private-event', type: 'test.saved', version: 1, tenantId: tenant, aggregate: { type: 'test', id: 'one' }, revision: 1, actor: { kind: 'user', id: tenant }, occurredAt: new Date().toISOString(), correlationId: 'correlation', causationId: 'cause', privacy: 'P3', payload: { text: 'event-private-canary' }, provenance: { origin: 'vault', sig: null } });
      return ok(seq);
    });
    await session.storage.transaction(tx => tx.records.put(put(tenant, 'nonce')));
    const before = (await rows(indexedDB, 'all-tables')).records;
    await session.storage.transaction(tx => tx.records.put({ ...put(tenant, 'nonce'), expectedRevision: 1 }));
    const after = await rows(indexedDB, 'all-tables');
    const encryptedBefore = before?.find(row => (row as { format?: string }).format === 'classrup.storage-row/v1') as { nonce: string };
    const encryptedAfter = after.records?.find(row => (row as { format?: string }).format === 'classrup.storage-row/v1') as { nonce: string };
    expect(encryptedAfter.nonce).not.toEqual(encryptedBefore.nonce);
    for (const canary of ['blob-private-canary', 'response-private-canary', 'event-private-canary', 'idempotency-key-private-canary']) expect(JSON.stringify(after)).not.toContain(canary);
    await session.lock();
    const reopened = await openVault({ name: 'all-tables', indexedDB });
    const unlocked = await reopened.unlock(passphrase);
    expect(await unlocked.storage.read(tx => tx.blobs.get(tenant, blob.value.ref)?.bytes)).toEqual(bytes);
    expect(await unlocked.storage.read(tx => tx.outbox.get('private-event')?.payload)).toEqual({ text: 'event-private-canary' });
    expect(await unlocked.storage.read(tx => tx.idempotency.lookup({ tenant, actor: 'actor', command: 'test.save', key: 'idempotency-key-private-canary' }, Date.now())?.response)).toEqual({ text: 'response-private-canary' });
    await unlocked.lock();
  }, 30000);

  it('keeps a legacy database intact when its migration commit fails and permits a clean retry', async () => {
    const indexedDB = new IDBFactory();
    const created = await createIdentity(passphrase);
    const legacy = await openIndexedDbStorage({ name: 'classrup-vault:migration-failure', indexedDB });
    await legacy.transaction(tx => { tx.records.put({ tenant: 'local-vault', type: 'vault.identity', id: 'root', data: created.protectedIdentity, idx: [null, null, null, null], expectedRevision: 0, now: Date.now() }); return tx.records.put(put(created.identity.principal, 'legacy', 'migration-canary')); });
    await legacy.close();
    created.identity.lock();
    const vault = await openVault({ name: 'migration-failure', indexedDB });
    const original = FakeDatabase.prototype.transaction;
    const spy = vi.spyOn(FakeDatabase.prototype, 'transaction').mockImplementation(function (this: IDBDatabase, ...args: Parameters<typeof original>) {
      if (args[1] === 'readwrite') throw new DOMException('injected quota failure', 'QuotaExceededError');
      return original.apply(this, args);
    });
    try { await expect(vault.unlock(passphrase)).rejects.toThrow('injected quota failure'); }
    finally { spy.mockRestore(); }
    const persisted = JSON.stringify(await rows(indexedDB, 'migration-failure'));
    expect(persisted).toContain('migration-canary');
    expect(persisted).not.toContain('classrup.storage-row/v1');
    const session = await vault.unlock(passphrase);
    expect(JSON.stringify(await rows(indexedDB, 'migration-failure'))).not.toContain('migration-canary');
    await session.lock();
  }, 30000);

  it('rejects header deletion even if every domain row is replaced with valid legacy plaintext', async () => {
    const indexedDB = new IDBFactory();
    const vault = await openVault({ name: 'downgrade', indexedDB });
    const session = await vault.create(passphrase);
    const principal = session.principal;
    await session.storage.transaction(tx => tx.records.put(put(principal, 'original')));
    await session.lock();
    await mutate(indexedDB, 'downgrade', (store, keys) => {
      for (const key of keys) if (!String(key).startsWith('local-vault')) store.delete(key);
      store.put({ tenant: principal, type: 'test.secret', id: 'injected', revision: 1, data: JSON.stringify({ text: 'attacker-chosen' }), idx: [null, null, null, null], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, `${principal}\u0001test.secret\u0001injected`);
    });
    await mutate(indexedDB, 'downgrade', (store) => store.delete('vault.encryption/v1'), 'meta');
    const reopened = await openVault({ name: 'downgrade', indexedDB });
    await expect(reopened.unlock(passphrase)).rejects.toThrow('Missing encrypted storage header');
    await reopened.close();
  }, 30000);

  it('preserves the writer fence and rolls back a superseded encrypted writer', async () => {
    const indexedDB = new IDBFactory();
    const locks = { request: async (_name: string, _options: unknown, callback: (lock: object | null) => Promise<void>) => callback({}) };
    const vault = await openVault({ name: 'fenced', indexedDB, locks });
    const session = await vault.create(passphrase);
    const other = await openVault({ name: 'fenced', indexedDB, locks });
    await expect(session.storage.transaction(tx => tx.records.put(put(session.principal, 'stale')))).rejects.toThrow();
    expect(await session.storage.read(tx => tx.records.get(session.principal, 'test.secret', 'stale'))).toBeUndefined();
    await session.lock();
    const fresh = await other.unlock(passphrase);
    expect((await fresh.storage.transaction(tx => tx.records.put(put(fresh.principal, 'fresh')))).ok).toBe(true);
    await fresh.lock();
  }, 30000);

  it('rejects deletion of one domain row instead of silently loading partial state', async () => {
    const indexedDB = new IDBFactory();
    const vault = await openVault({ name: 'deletion', indexedDB });
    const session = await vault.create(passphrase);
    await session.storage.transaction(tx => tx.records.put(put(session.principal, 'delete-me')));
    await session.lock();
    await mutate(indexedDB, 'deletion', (store, keys) => {
      const domain = keys.find(key => !String(key).startsWith('local-vault'));
      if (domain === undefined) throw new Error('Missing domain row');
      store.delete(domain);
    });
    const reopened = await openVault({ name: 'deletion', indexedDB });
    await expect(reopened.unlock(passphrase)).rejects.toThrow('Encrypted storage inventory mismatch');
    await reopened.close();
  }, 30000);

});
