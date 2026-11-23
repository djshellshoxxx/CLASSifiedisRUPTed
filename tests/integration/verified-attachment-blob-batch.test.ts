import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createMemoryStorage } from '../../packages/kernel/src/storage/storage.ts';
import { openIndexedDbStorage } from '../../packages/kernel/src/storage/indexeddb.ts';
import { openSqliteStorage } from '../../packages/kernel/src/storage/sqlite.ts';
import { blobRefOf } from '../../packages/kernel/src/storage/tx.ts';
import { MAX_VERIFIED_BLOB_BATCH_ITEMS, readVerifiedBlobBatch } from '../../packages/kernel/src/storage/verified-blob.ts';

const now = Date.parse('2026-11-23T00:00:00.000Z');
const adapters = [
  { name: 'memory', open: async () => createMemoryStorage() },
  { name: 'indexeddb', open: () => openIndexedDbStorage({ name: 'verified-blob-batch', indexedDB: new IDBFactory() }) },
  { name: 'sqlite', open: async () => openSqliteStorage({ path: ':memory:' }) },
];

describe('bounded verified attachment batches', () => {
  for (const adapter of adapters) {
    it(adapter.name + ': reads detached tenant batches and fails closed on invalid members', async () => {
      const storage = await adapter.open();
      try {
        const firstBytes = Uint8Array.of(7, 8, 9);
        const secondBytes = Uint8Array.of(17, 18, 19, 20);
        const first = await storage.transaction(tx => tx.blobs.put({
          tenant: 'owner', bytes: firstBytes, contentType: 'image/png',
          privacy: 'P0', encrypted: false, now,
        }));
        const second = await storage.transaction(tx => tx.blobs.put({
          tenant: 'owner', bytes: secondBytes, contentType: 'image/png',
          privacy: 'P0', encrypted: false, now,
        }));
        expect(first.ok && second.ok).toBe(true);
        if (!first.ok || !second.ok) return;
        const refs = [first.value.ref, second.value.ref];
        const pending = readVerifiedBlobBatch(storage, 'owner', refs);
        refs.reverse();
        const batch = await pending;
        expect(batch.map(x => x.ref)).toEqual([first.value.ref, second.value.ref]);
        expect(batch.map(x => x.bytes)).toEqual([firstBytes, secondBytes]);
        expect(batch[0]?.bytes).not.toBe(firstBytes);
        batch[0]?.bytes.fill(0);
        expect((await readVerifiedBlobBatch(storage, 'owner', [first.value.ref]))[0]?.bytes).toEqual(firstBytes);

        const missing = await blobRefOf(Uint8Array.of(44, 55));
        await expect(readVerifiedBlobBatch(storage, 'owner', [first.value.ref, missing])).rejects.toThrow(/integrity/);
        await expect(readVerifiedBlobBatch(storage, 'someone-else', [first.value.ref])).rejects.toThrow(/integrity/);
        await expect(readVerifiedBlobBatch(storage, 'owner', [first.value.ref + '='])).rejects.toThrow(/integrity/);
        await expect(readVerifiedBlobBatch(storage, 'owner', [first.value.ref, first.value.ref])).rejects.toThrow(/integrity/);
        await expect(readVerifiedBlobBatch(storage, 'owner', [first.value.ref, second.value.ref], 6)).rejects.toThrow(/integrity/);
        await expect(readVerifiedBlobBatch(storage, 'owner', [first.value.ref], -1)).rejects.toThrow(/integrity/);
        await expect(readVerifiedBlobBatch(storage, 'owner', Array(MAX_VERIFIED_BLOB_BATCH_ITEMS + 1).fill(first.value.ref))).rejects.toThrow(/integrity/);
        expect(await readVerifiedBlobBatch(storage, 'owner', [])).toEqual([]);
      } finally {
        await storage.close();
      }
    });
  }
});
