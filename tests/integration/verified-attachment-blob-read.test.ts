import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createMemoryStorage, type Storage } from '../../packages/kernel/src/storage/storage.ts';
import { openIndexedDbStorage } from '../../packages/kernel/src/storage/indexeddb.ts';
import { openSqliteStorage } from '../../packages/kernel/src/storage/sqlite.ts';
import { blobRefOf, type MediaBlob, type Tx } from '../../packages/kernel/src/storage/tx.ts';
import { readVerifiedBlob, readVerifiedBlobBatch, verifyStoredBlob } from '../../packages/kernel/src/storage/verified-blob.ts';

const now = Date.parse('2026-11-23T00:00:00.000Z');
const adapters = [
  { name: 'memory', open: async () => createMemoryStorage() },
  { name: 'indexeddb', open: () => openIndexedDbStorage({ name: 'verified-blob-read', indexedDB: new IDBFactory() }) },
  { name: 'sqlite', open: async () => openSqliteStorage({ path: ':memory:' }) },
];

describe('verified content-addressed attachment reads', () => {
  it('rejects invalid captured metadata even when a later getter read looks valid', async () => {
    const bytes = Uint8Array.of(47, 13, 5);
    const blob: MediaBlob = {
      ref: await blobRefOf(bytes), bytes, size: bytes.byteLength,
      contentType: 'image/png', privacy: 'P0', encrypted: false,
      createdAt: new Date(now).toISOString(), holders: 0,
    };
    // The previous verifier captured P4, re-read P0 for its admission check,
    // then returned the first (invalid) value beside verified bytes.
    let reads = 0;
    Object.defineProperty(blob, 'privacy', {
      configurable: true,
      get: () => (++reads === 1 ? 'P4' : 'P0'),
    });
    await expect(verifyStoredBlob(blob)).rejects.toThrow(/integrity/);
    expect(reads).toBe(1);
  });

  it('accepts an admitted captured metadata snapshot without getter re-reads', async () => {
    const bytes = Uint8Array.of(17, 3, 55);
    const blob: MediaBlob = {
      ref: await blobRefOf(bytes), bytes, size: bytes.byteLength,
      contentType: 'image/png', privacy: 'P0', encrypted: false,
      createdAt: new Date(now).toISOString(), holders: 0,
    };
    let reads = 0;
    Object.defineProperty(blob, 'privacy', {
      configurable: true,
      get: () => (++reads === 1 ? 'P0' : 'P4'),
    });
    const result = await verifyStoredBlob(blob);
    expect(result.privacy).toBe('P0');
    expect(result.bytes).toEqual(bytes);
    expect(reads).toBe(1);
  });

  it('rejects impossible stored metadata even when bytes have a valid SHA-256 address', async () => {
    const bytes = Uint8Array.of(7, 3, 11);
    const base: MediaBlob = {
      ref: await blobRefOf(bytes), bytes, size: bytes.length,
      contentType: 'image/png', privacy: 'P0', encrypted: false,
      createdAt: new Date(now).toISOString(), holders: 0,
    };
    expect((await verifyStoredBlob(base)).bytes).toEqual(bytes);
    const malformed: readonly Record<string, unknown>[] = [
      { contentType: 'IMAGE/PNG' }, { contentType: 'image/png; charset=utf-8' },
      { privacy: 'P4' }, { encrypted: 'false' },
      { createdAt: 'not-a-date' }, { createdAt: '2026-11-23T00:00:00Z' },
      { holders: -1 }, { holders: Number.MAX_SAFE_INTEGER + 1 },
    ];
    for (const invalid of malformed) {
      await expect(verifyStoredBlob({ ...base, ...invalid } as MediaBlob)).rejects.toThrow(/integrity/);
    }
  });

  it('sqlite: rejects a stored private-plaintext row even with a valid content address', async () => {
    const storage = await openSqliteStorage({ path: ':memory:' });
    try {
      const bytes = Uint8Array.of(8, 9, 10);
      const saved = await storage.transaction(tx => tx.blobs.put({
        tenant: 'owner', bytes, contentType: 'image/png', privacy: 'P0', encrypted: false, now,
      }));
      expect(saved.ok).toBe(true);
      if (!saved.ok) return;

      // Model a corrupted relay row: SQLite write admission explicitly forbids
      // P1/P2/P3 plaintext, but the bytes still match their valid SHA-256 ref.
      const corrupted: Storage = {
        ...storage,
        read: async <T>(fn: (tx: Tx) => T | Promise<T>): Promise<T> => storage.read(tx => fn({
          ...tx,
          blobs: {
            ...tx.blobs,
            get: (tenant, ref) => {
              const found = tx.blobs.get(tenant, ref);
              return found ? { ...found, privacy: 'P2' as const, encrypted: false } : undefined;
            },
          },
        })),
      };
      await expect(readVerifiedBlob(corrupted, 'owner', saved.value.ref)).rejects.toThrow(/integrity/);
      await expect(readVerifiedBlobBatch(corrupted, 'owner', [saved.value.ref])).rejects.toThrow(/integrity/);
      expect((await readVerifiedBlob(storage, 'owner', saved.value.ref))?.bytes).toEqual(bytes);
      expect((await readVerifiedBlobBatch(storage, 'owner', [saved.value.ref]))[0]?.bytes).toEqual(bytes);
    } finally {
      await storage.close();
    }
  });

  for (const adapter of adapters) {
    it(adapter.name + ': rejects invalid adapter metadata in single and batch reads', async () => {
      const storage = await adapter.open();
      try {
        const saved = await storage.transaction(tx => tx.blobs.put({
          tenant: 'owner', bytes: Uint8Array.of(1, 5, 9),
          contentType: 'image/png', privacy: 'P0', encrypted: false, now,
        }));
        expect(saved.ok).toBe(true);
        if (!saved.ok) return;
        const corrupted: Storage = {
          ...storage,
          read: async <T>(fn: (tx: Tx) => T | Promise<T>): Promise<T> => storage.read(tx => fn({
            ...tx,
            blobs: {
              ...tx.blobs,
              get: (tenant, ref) => {
                const found = tx.blobs.get(tenant, ref);
                return found ? { ...found, privacy: 'P4' as MediaBlob['privacy'] } : undefined;
              },
            },
          })),
        };
        await expect(readVerifiedBlob(corrupted, 'owner', saved.value.ref)).rejects.toThrow(/integrity/);
        await expect(readVerifiedBlobBatch(corrupted, 'owner', [saved.value.ref])).rejects.toThrow(/integrity/);
        expect((await readVerifiedBlob(storage, 'owner', saved.value.ref))?.bytes).toEqual(Uint8Array.of(1, 5, 9));
      } finally {
        await storage.close();
      }
    });


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
