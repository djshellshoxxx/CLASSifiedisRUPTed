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
  it('snapshots only bounded array entries without executing a caller-supplied iterator', async () => {
    const storage = createMemoryStorage();
    try {
      const bytes = Uint8Array.of(101, 15, 3);
      const saved = await storage.transaction(tx => tx.blobs.put({
        tenant: 'owner', bytes, contentType: 'image/png',
        privacy: 'P0', encrypted: false, now,
      }));
      expect(saved.ok).toBe(true);
      if (!saved.ok) return;

      // A real Array can replace its iterator. The prior spread evaluated the
      // injected getter even though length was already admitted as one.
      const refs = [saved.value.ref];
      Object.defineProperty(refs, Symbol.iterator, {
        get() { throw new Error('untrusted iterator must not run'); },
      });
      const verified = await readVerifiedBlobBatch(storage, 'owner', refs);
      expect(verified.map(blob => blob.ref)).toEqual([saved.value.ref]);
      expect(verified[0]?.bytes).toEqual(bytes);

      // With length zero, the previous spread would accept extra refs from an
      // override instead of returning the declared empty request.
      const empty: string[] = [];
      Object.defineProperty(empty, Symbol.iterator, {
        value: function* () { yield saved.value.ref; },
      });
      expect(await readVerifiedBlobBatch(storage, 'owner', empty)).toEqual([]);
    } finally {
      await storage.close();
    }
  });
  it('uses one admitted array-length snapshot even when a Proxy reports changing lengths', async () => {
    const storage = createMemoryStorage();
    try {
      const bytes = Uint8Array.of(41, 17, 9);
      const saved = await storage.transaction(tx => tx.blobs.put({
        tenant: 'owner', bytes, contentType: 'image/png',
        privacy: 'P0', encrypted: false, now,
      }));
      expect(saved.ok).toBe(true);
      if (!saved.ok) return;

      // Array.isArray(proxy) is true. The old implementation admitted length 1,
      // then read a second, unbounded length for its indexed copy.
      let lengthReads = 0;
      const refs = new Proxy([saved.value.ref], {
        get(target, property, receiver) {
          if (property === 'length') {
            lengthReads += 1;
            return lengthReads === 1 ? 1 : MAX_VERIFIED_BLOB_BATCH_ITEMS + 100;
          }
          return Reflect.get(target, property, receiver);
        },
      });
      const result = await readVerifiedBlobBatch(storage, 'owner', refs);
      expect(result.map(blob => blob.ref)).toEqual([saved.value.ref]);
      expect(result[0]?.bytes).toEqual(bytes);
      expect(lengthReads).toBe(1);

      // A zero-length admitted request must not grow between admission and
      // snapshot, even when a hostile array Proxy claims extra indices.
      let emptyLengthReads = 0;
      const empty = new Proxy([] as string[], {
        get(target, property, receiver) {
          if (property === 'length') {
            emptyLengthReads += 1;
            return emptyLengthReads === 1 ? 0 : MAX_VERIFIED_BLOB_BATCH_ITEMS + 100;
          }
          return Reflect.get(target, property, receiver);
        },
      });
      expect(await readVerifiedBlobBatch(storage, 'owner', empty)).toEqual([]);
      expect(emptyLengthReads).toBe(1);

      // Proxy lengths need admission even when the underlying target is an Array.
      const negative = new Proxy([saved.value.ref], {
        get(target, property, receiver) {
          return property === 'length' ? -1 : Reflect.get(target, property, receiver);
        },
      });
      await expect(readVerifiedBlobBatch(storage, 'owner', negative)).rejects.toThrow(/integrity/);
    } finally {
      await storage.close();
    }
  });

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
