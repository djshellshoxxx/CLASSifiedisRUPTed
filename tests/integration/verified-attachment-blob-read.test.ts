import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createMemoryStorage, type Storage } from '../../packages/kernel/src/storage/storage.ts';
import { openIndexedDbStorage } from '../../packages/kernel/src/storage/indexeddb.ts';
import { openSqliteStorage } from '../../packages/kernel/src/storage/sqlite.ts';
import { blobRefOf, type MediaBlob, type Tx } from '../../packages/kernel/src/storage/tx.ts';
import { readVerifiedBlob, verifyStoredBlob } from '../../packages/kernel/src/storage/verified-blob.ts';

const now = Date.parse('2026-11-23T00:00:00.000Z');
const adapters = [
  { name: 'memory', open: async () => createMemoryStorage() },
  { name: 'indexeddb', open: () => openIndexedDbStorage({ name: 'verified-blob-read', indexedDB: new IDBFactory() }) },
  { name: 'sqlite', open: async () => openSqliteStorage({ path: ':memory:' }) },
];

describe('verified content-addressed attachment reads', () => {
  for (const adapter of adapters) {

    it(`${adapter.name}: detaches adapter-owned bytes before read completion`, async () => {
      const storage = await adapter.open();
      try {
        const original = Uint8Array.of(91, 14, 73, 5);
        const saved = await storage.transaction(tx => tx.blobs.put({
          tenant: 'owner', bytes: original, contentType: 'application/octet-stream',
          privacy: 'P0', encrypted: false, now,
        }));
        expect(saved.ok).toBe(true);
        if (!saved.ok) return;

        // Model an adapter or transaction boundary that invalidates its issued
        // byte view after the callback has finished. The old implementation
        // returned this same view from storage.read and hashed it too late.
        const storageWithLateMutation: Storage = {
          ...storage,
          read: async <T>(fn: (tx: Tx) => T | Promise<T>): Promise<T> => {
            let observed: MediaBlob | undefined;
            const result = await storage.read(tx => fn({
              ...tx,
              blobs: {
                ...tx.blobs,
                get: (tenant, ref) => {
                  const found = tx.blobs.get(tenant, ref);
                  observed = found;
                  return found;
                },
              },
            }));
            observed?.bytes.fill(0);
            return result;
          },
        };

        const verified = await readVerifiedBlob(storageWithLateMutation, 'owner', saved.value.ref);
        expect(verified?.bytes).toEqual(original);
        expect(verified?.ref).toBe(saved.value.ref);
        expect(verified?.bytes).not.toBe(original);
      } finally {
        await storage.close();
      }
    });
    it(`${adapter.name}: returns an isolated verified snapshot, rejects corruption and honors tenant scope`, async () => {
      const storage = await adapter.open();
      try {
        const original = Uint8Array.of(3, 17, 42, 255);
        const saved = await storage.transaction(tx => tx.blobs.put({
          tenant: 'owner', bytes: original, contentType: 'image/png',
          privacy: 'P0', encrypted: false, now,
        }));
        expect(saved.ok).toBe(true);
        if (!saved.ok) return;
        const ref = saved.value.ref;
        const read = await readVerifiedBlob(storage, 'owner', ref);
        expect(read?.bytes).toEqual(original);
        expect(read?.size).toBe(original.length);
        expect(await readVerifiedBlob(storage, 'other-owner', ref)).toBeUndefined();
        expect(await readVerifiedBlob(storage, 'owner', await blobRefOf(Uint8Array.of(9, 9, 9)))).toBeUndefined();
        await expect(readVerifiedBlob(storage, 'owner', ref + '=')).rejects.toThrow(/integrity/);

        expect(read).toBeDefined();
        if (!read) return;
        const tampered = { ...read, bytes: Uint8Array.of(3, 17, 42, 254) };
        await expect(verifyStoredBlob(tampered)).rejects.toThrow(/integrity/);
        await expect(verifyStoredBlob({ ...read, size: read.size + 1 })).rejects.toThrow(/integrity/);
        await expect(verifyStoredBlob({ ...read, ref: ref.slice(0, -1) + '=' })).rejects.toThrow(/integrity/);
        const verifiedCopy = await verifyStoredBlob(read);
        verifiedCopy.bytes.fill(0);
        read.bytes.fill(0);
        const again = await readVerifiedBlob(storage, 'owner', ref);
        expect(again?.bytes).toEqual(original);
        expect(again?.bytes).not.toBe(read.bytes);
      } finally {
        await storage.close();
      }
    });
  }
});
