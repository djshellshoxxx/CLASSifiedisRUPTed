import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createMemoryStorage } from '../../packages/kernel/src/storage/storage.ts';
import { openIndexedDbStorage } from '../../packages/kernel/src/storage/indexeddb.ts';
import { openSqliteStorage } from '../../packages/kernel/src/storage/sqlite.ts';
import { blobRefOf, isBlobRef } from '../../packages/kernel/src/storage/tx.ts';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const adapters = [
  { name: 'memory', open: async () => createMemoryStorage() },
  { name: 'indexeddb', open: () => openIndexedDbStorage({ name: 'canonical-blob-admission', indexedDB: new IDBFactory() }) },
  { name: 'sqlite', open: async () => openSqliteStorage({ path: ':memory:' }) },
];

describe('canonical content-addressed attachment references', () => {
  for (const adapter of adapters) {
    it(`${adapter.name}: rejects noncanonical base64url aliases before holder persistence`, async () => {
      const storage = await adapter.open();
      try {
        const tenant = 'owner';
        const ref = await blobRefOf(Uint8Array.of(3, 17, 255, 42));
        expect(isBlobRef(ref)).toBe(true);
        const last = alphabet.indexOf(ref.at(-1)!);
        // The 32-byte digest leaves two zero pad bits in its final base64url sextet.
        // Changing only those bits names the same decoded digest but is noncanonical.
        expect(last).toBeGreaterThanOrEqual(0);
        expect(last % 4).toBe(0);
        const alias = ref.slice(0, -1) + alphabet[last + 1];
        expect(alias).not.toBe(ref);
        const malformed = [
          alias,
          'blob:sha256-' + 'A'.repeat(42) + 'B',
          ref + '=',
          ref.replace('blob:sha256-', 'blob:sha256+/'),
        ];
        for (const badRef of malformed) {
          expect(isBlobRef(badRef)).toBe(false);
          const result = await storage.transaction(tx => tx.blobs.attach(tenant, badRef, 'record/1'));
          expect(result).toMatchObject({
            ok: false, error: { code: 'VALIDATION_FAILED', fields: [{ path: 'ref', code: 'INVALID_BLOB_REF' }] },
          });
        }
        expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual({
          referenceCount: 0, holderCount: 0, missingCount: 0, limitExceeded: false,
        });
        const accepted = await storage.transaction(tx => tx.blobs.attach(tenant, ref, 'record/1'));
        expect(accepted).toMatchObject({ ok: true, value: { holders: 1, present: false } });
        expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual({
          referenceCount: 1, holderCount: 1, missingCount: 1, limitExceeded: false,
        });
      } finally {
        await storage.close();
      }
    });
  }
});
