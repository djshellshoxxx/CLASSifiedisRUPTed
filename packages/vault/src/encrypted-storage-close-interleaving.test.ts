import { IDBFactory, IDBDatabase as FakeDatabase } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { createFakeClock } from '@classrup/kernel';
import type { VaultLocks } from '@classrup/kernel/browser';
import { openVault, type Vault } from './vault.ts';

const passphrase = 'synthetic close interleaving acceptance passphrase';
const clock = createFakeClock('2026-11-27T12:00:00.000Z');
const record = (tenant: string, id: string, text: string) => ({
  tenant, type: 'test.close-private', id, data: { text },
  idx: [text, null, null, null] as const, expectedRevision: 0, now: clock.now(),
});

function latch() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
}

function locks(): VaultLocks {
  const held = new Set<string>();
  return {
    async request(name, _options, callback) {
      if (held.has(name)) return callback(null);
      held.add(name);
      try { await callback({ name }); } finally { held.delete(name); }
    },
  };
}

function outcome<T>(promise: Promise<T>) {
  return promise.then(value => ({ ok: true as const, value }), error => ({ ok: false as const, error }));
}

/** Hold an actual crypto result, without replacing its bytes or verification. */
function holdInventoryCrypto(boundary: 'decrypt' | 'digest', name: string) {
  const entered = latch(), gate = latch();
  let armed = true;
  const hold = async (pending: Promise<ArrayBuffer>): Promise<ArrayBuffer> => {
    const result = await pending;
    entered.release();
    await gate.promise;
    return result;
  };
  const decoder = new TextDecoder();
  if (boundary === 'decrypt') {
    const decrypt = crypto.subtle.decrypt.bind(crypto.subtle);
    const spy = vi.spyOn(crypto.subtle, 'decrypt').mockImplementation((algorithm, key, data) => {
      const pending = decrypt(algorithm, key, data);
      const parameters = algorithm as Partial<AesGcmParams>;
      const aad = JSON.stringify(['classrup.storage-row/v1', `classrup-vault:${name}`, 'meta', 'vault.inventory/v1']);
      if (!armed || parameters.name !== 'AES-GCM' || !parameters.additionalData
        || decoder.decode(parameters.additionalData) !== aad) return pending;
      armed = false;
      return hold(pending);
    });
    return { entered: entered.promise, release: gate.release, restore: () => spy.mockRestore() };
  }
  const digest = crypto.subtle.digest.bind(crypto.subtle);
  const spy = vi.spyOn(crypto.subtle, 'digest').mockImplementation((algorithm, data) => {
    const pending = digest(algorithm, data);
    let encryptedRow = false;
    try {
      const value = JSON.parse(decoder.decode(data)) as { format?: unknown } | null;
      encryptedRow = value?.format === 'classrup.storage-row/v1';
    } catch { /* Identity derivation hashes are not storage inventory rows. */ }
    if (!armed || !encryptedRow) return pending;
    armed = false;
    return hold(pending);
  });
  return { entered: entered.promise, release: gate.release, restore: () => spy.mockRestore() };
}

/** Read committed bytes independently of the vault's decrypted working set. */
async function durableSnapshot(factory: IDBFactory, name: string): Promise<unknown> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open(`classrup-vault:${name}`);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    const tables = Array.from(db.objectStoreNames);
    const tx = db.transaction(tables, 'readonly');
    const done = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    void done.catch(() => undefined);
    const read = <T>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const result = await Promise.all(tables.map(async table => {
      const store = tx.objectStore(table);
      const [keys, values] = await Promise.all([read(store.getAllKeys()), read(store.getAll())]);
      // Opening a connection legitimately replaces the writer fence only.
      return [table, keys.flatMap((key, index) => table === 'meta' && key === 'writer' ? [] : [[key, values[index]]])];
    }));
    await done;
    return result;
  } finally { db.close(); }
}

/** The IndexedDB write really commits; only delivery to its awaiting caller is held. */
function holdCommitDelivery(name: string) {
  const committed = latch(), gate = latch();
  const original = FakeDatabase.prototype.transaction;
  let armed = true;
  const spy = vi.spyOn(FakeDatabase.prototype, 'transaction').mockImplementation(function (this: IDBDatabase, ...args: Parameters<typeof original>) {
    const tx = original.apply(this, args);
    const tables = typeof args[0] === 'string' ? [args[0]] : Array.from(args[0]);
    if (!armed || this.name !== `classrup-vault:${name}` || args[1] !== 'readwrite' || !tables.includes('records')) return tx;
    armed = false;
    return new Proxy(tx, {
      get(target, property) {
        const value: unknown = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set(target, property, value: unknown) {
        if (property === 'oncomplete' && typeof value === 'function') {
          return Reflect.set(target, property, (event: Event) => {
            committed.release();
            void gate.promise.then(() => { value.call(target, event); });
          }, target);
        }
        return Reflect.set(target, property, value, target);
      },
    });
  });
  return { committed: committed.promise, release: gate.release, restore: () => spy.mockRestore() };
}

describe('encrypted storage close interleavings', () => {
  it.each(['decrypt', 'digest'] as const)('does not publish an unlocked session after closing during inventory %s', async boundary => {
    const indexedDB = new IDBFactory();
    const options = { name: `inventory-close-${boundary}`, indexedDB, locks: locks(), clock };
    const original = await openVault(options);
    const session = await original.create(passphrase);
    const principal = session.principal;
    const saved = await session.storage.transaction(tx => tx.records.put(record(principal, 'saved', 'private retained record')));
    expect(saved.ok).toBe(true);
    await session.lock();
    const before = await durableSnapshot(indexedDB, options.name);
    const opening = await openVault(options);
    const barrier = holdInventoryCrypto(boundary, options.name);
    const unlocking = outcome(opening.unlock(passphrase));
    let drain: Promise<unknown> = Promise.resolve();
    let reopened: Vault | undefined;
    try {
      await Promise.race([barrier.entered, unlocking.then(() => { throw new Error('Unlock settled before the crypto boundary'); })]);
      const first = opening.close(), second = opening.close();
      drain = Promise.allSettled([first, second]);
      await expect(opening.isInitialized()).rejects.toThrow('Vault closed');
      await expect(opening.unlock(passphrase)).rejects.toThrow('Vault closed');
      barrier.release();
      const result = await unlocking;
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatchObject({ message: 'Vault closed' });
      await Promise.all([first, second]);
      barrier.restore();
      await expect(opening.isInitialized()).rejects.toThrow('Vault closed');
      expect(await durableSnapshot(indexedDB, options.name)).toEqual(before);
      reopened = await openVault(options);
      const fresh = await reopened.unlock(passphrase);
      expect(fresh.principal).toBe(principal);
      expect(await fresh.storage.read(tx => tx.records.get(principal, 'test.close-private', 'saved')))
        .toEqual(saved.ok ? saved.value : undefined);
    } finally {
      barrier.release(); barrier.restore();
      const result = await unlocking;
      if (result.ok) await result.value.lock();
      await drain; await opening.close(); await reopened?.close(); await original.close();
    }
  }, 30000);

  it('preserves a committed write while every close caller waits for its completion delivery', async () => {
    const indexedDB = new IDBFactory();
    const options = { name: 'committed-close-delivery', indexedDB, locks: locks(), clock };
    const vault = await openVault(options);
    const session = await vault.create(passphrase);
    const principal = session.principal;
    const original = await session.storage.transaction(tx => tx.records.put(record(principal, 'saved', 'original private value')));
    expect(original.ok).toBe(true);
    const before = await durableSnapshot(indexedDB, options.name);
    const barrier = holdCommitDelivery(options.name);
    const writing = outcome(session.storage.transaction(tx => tx.records.put({ ...record(principal, 'saved', 'committed private value'), expectedRevision: 1 })));
    let drain: Promise<unknown> = Promise.resolve();
    let reopened: Vault | undefined;
    try {
      await Promise.race([barrier.committed, writing.then(() => { throw new Error('Write settled before the IndexedDB commit boundary'); })]);
      expect(await durableSnapshot(indexedDB, options.name)).not.toEqual(before);
      const first = session.lock(), second = vault.close();
      drain = Promise.allSettled([first, second]);
      let firstSettled = false, secondSettled = false;
      void first.then(() => { firstSettled = true; }, () => { firstSettled = true; });
      void second.then(() => { secondSettled = true; }, () => { secondSettled = true; });
      await new Promise<void>(resolve => { setTimeout(resolve, 0); });
      expect(firstSettled).toBe(false);
      expect(secondSettled).toBe(false);
      await expect(session.storage.read(() => 'late')).rejects.toThrow('Vault closed');
      await expect(openVault(options)).rejects.toMatchObject({ error: { code: 'DEPENDENCY_UNAVAILABLE', params: { reason: 'vault_locked' } } });
      barrier.release();
      const result = await writing;
      expect(result).toMatchObject({ ok: true, value: { ok: true, value: { revision: 2, data: { text: 'committed private value' } } } });
      await Promise.all([first, second]);
      barrier.restore();
      await expect(session.storage.read(() => 'late')).rejects.toThrow('Vault closed');
      reopened = await openVault(options);
      const fresh = await reopened.unlock(passphrase);
      expect(fresh.principal).toBe(principal);
      expect(await fresh.storage.read(tx => tx.records.get(principal, 'test.close-private', 'saved')))
        .toMatchObject({ revision: 2, data: { text: 'committed private value' }, createdAt: clock.iso(), updatedAt: clock.iso() });
    } finally {
      barrier.release(); barrier.restore();
      await writing; await drain; await vault.close(); await reopened?.close();
    }
  }, 30000);
});
