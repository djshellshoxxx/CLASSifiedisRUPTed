import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createStorage } from '../../packages/kernel/src/index.ts';
import { createIndexedDbDriver, openIndexedDbStorage } from '../../packages/kernel/src/storage/indexeddb.ts';
import { TABLES } from '../../packages/kernel/src/storage/memory-driver.ts';

/**
 * Exercises a real fake-indexeddb readwrite transaction abort, rather than
 * the memory driver's injected persist rejection. This is an adapter-level
 * regression; it does not simulate OS crash durability or vault encryption.
 */
describe('IndexedDB native transaction abort rollback', () => {
  it('restores staged attachment holders and persisted bytes before retry and reopen', async () => {
    const indexedDB = new IDBFactory();
    const name = 'classrup-native-abort-attachment-retirement';
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => {
        for (const table of TABLES) request.result.createObjectStore(table);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('database open failed'));
    });
    let abortNext = false;
    let aborted = 0;
    const wrapped = new Proxy(db, {
      get(target, key) {
        if (key === 'transaction') {
          return (...args: Parameters<IDBDatabase['transaction']>) => {
            const tx = target.transaction(...args);
            if (abortNext && tx.mode === 'readwrite') {
              abortNext = false;
              queueMicrotask(() => {
                aborted++;
                tx.abort();
              });
            }
            return tx;
          };
        }
        const value = Reflect.get(target, key, target) as unknown;
        return typeof value === 'function' ? value.bind(target) : value;
      },
    }) as IDBDatabase;
    const storage = createStorage(createIndexedDbDriver(wrapped, {}));
    const tenant = 'owner-native-abort';
    let ref = '';
    try {
      const seeded = await storage.transaction(async tx => {
        const put = await tx.blobs.put({
          tenant, bytes: Uint8Array.of(17, 18, 19),
          contentType: 'image/png', privacy: 'P0', encrypted: false, now: Date.now(),
        });
        if (!put.ok) return put;
        ref = put.value.ref;
        const current = tx.blobs.attach(tenant, ref, 'current-owner');
        if (!current.ok) return current;
        return tx.blobs.attach(tenant, ref, 'stale-owner');
      });
      expect(seeded.ok).toBe(true);
      const before = await storage.read(tx => ({
        blob: tx.blobs.get(tenant, ref),
        counts: tx.blobs.referenceCoverage(tenant),
      }));
      expect(before.blob?.bytes).toEqual(Uint8Array.of(17, 18, 19));
      expect(before.blob?.holders).toBe(2);

      abortNext = true;
      await expect(storage.transaction(tx => tx.blobs.detach(tenant, ref, 'stale-owner')))
        .rejects.toThrow();
      expect(aborted).toBe(1);
      expect(await storage.read(tx => ({
        blob: tx.blobs.get(tenant, ref),
        counts: tx.blobs.referenceCoverage(tenant),
      }))).toEqual(before);

      const retried = await storage.transaction(tx => tx.blobs.detach(tenant, ref, 'stale-owner'));
      expect(retried.ok).toBe(true);
      expect(await storage.read(tx => tx.blobs.get(tenant, ref))).toMatchObject({ holders: 1 });
    } finally {
      await storage.close();
    }
    // Open a fresh adapter over the persisted IndexedDB bytes, not the prior
    // memory working set. A failed aborted commit must never reappear.
    const reopened = await openIndexedDbStorage({ name, indexedDB });
    try {
      const persisted = await reopened.read(tx => tx.blobs.get(tenant, ref));
      expect(persisted?.bytes).toEqual(Uint8Array.of(17, 18, 19));
      expect(persisted?.holders).toBe(1);
      const same = await reopened.transaction(tx => tx.blobs.attach(tenant, ref, 'current-owner'));
      expect(same.ok).toBe(true);
      expect(same.ok && same.value.holders).toBe(1);
      const absent = await reopened.transaction(tx => tx.blobs.attach(tenant, ref, 'stale-owner'));
      expect(absent.ok).toBe(true);
      expect(absent.ok && absent.value.holders).toBe(2);
    } finally {
      await reopened.close();
    }
  }, 30000);
});
