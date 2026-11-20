import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createMemoryStorage, ok } from '../../packages/kernel/src/index.ts';
import { openIndexedDbStorage } from '../../packages/kernel/src/storage/indexeddb.ts';
import { openSqliteStorage } from '../../packages/kernel/src/storage/sqlite.ts';
import { blobRefOf } from '../../packages/kernel/src/storage/tx.ts';
import { vaultFromStorage } from '../../packages/vault/src/vault.ts';

const now = Date.parse('2026-11-20T12:00:00.000Z');
const bytes = new Uint8Array([1, 2, 3, 4]);
const factories = [
  { name: 'memory', open: async () => createMemoryStorage() },
  { name: 'indexeddb', open: () => openIndexedDbStorage({ name: 'reference-coverage', indexedDB: new IDBFactory() }) },
  { name: 'sqlite', open: () => openSqliteStorage({ path: ':memory:' }) },
];

describe('read-only reference coverage across storage adapters', () => {
  for (const factory of factories) {
    it(`${factory.name}: counts owned, missing and foreign refs without returning identifiers or mutating rows`, async () => {
      const storage = await factory.open();
      try {
        const missingRef = await blobRefOf(new Uint8Array([8, 9]));
        const inserted = await storage.transaction(async tx => {
          const owned = await tx.blobs.put({ tenant: 'owner', bytes, contentType: 'image/png', privacy: 'P0', encrypted: false, now });
          if (!owned.ok) return owned;
          const foreign = await tx.blobs.put({ tenant: 'foreign', bytes, contentType: 'image/png', privacy: 'P0', encrypted: false, now });
          if (!foreign.ok) return foreign;
          tx.blobs.attach('owner', owned.value.ref, 'listing/1');
          tx.blobs.attach('owner', owned.value.ref, 'listing/2');
          tx.blobs.attach('owner', missingRef, 'listing/missing');
          tx.blobs.attach('foreign', owned.value.ref, 'foreign/1');
          return ok(owned.value.ref);
        });
        expect(inserted.ok).toBe(true);
        if (!inserted.ok) return;
        expect(await storage.read(tx => tx.blobs.referenceCoverage('owner'))).toEqual({
          referenceCount: 2, holderCount: 3, missingCount: 1, limitExceeded: false,
        });
        expect(await storage.read(tx => tx.blobs.referenceCoverage('foreign'))).toEqual({
          referenceCount: 1, holderCount: 1, missingCount: 0, limitExceeded: false,
        });
        const truncated = await storage.read(tx => tx.blobs.referenceCoverage('owner', 2));
        expect(truncated).toEqual({ referenceCount: null, holderCount: null, missingCount: null, limitExceeded: true });
        expect(JSON.stringify(truncated)).not.toContain(inserted.value);
        await storage.read(tx => {
          expect(() => tx.blobs.referenceCoverage('owner', 0)).toThrow(RangeError);
          expect(() => tx.blobs.referenceCoverage('owner', 10001)).toThrow(RangeError);
          expect(tx.blobs.info('owner', inserted.value)?.holders).toBe(2);
          expect(tx.blobs.info('foreign', inserted.value)?.holders).toBe(1);
          expect(tx.blobs.info('owner', missingRef)).toBeUndefined();
        });
      } finally {
        await storage.close();
      }
    });
  }
});

it('vault diagnostic is principal-bound and revoked with the unlocked session', async () => {
  const vault = vaultFromStorage(createMemoryStorage());
  const session = await vault.create('attachment reference diagnostic passphrase');
  const missingRef = await blobRefOf(new Uint8Array([7, 7, 7]));
  const foreignRef = await blobRefOf(new Uint8Array([6, 6, 6]));
  try {
    const written = await session.storage.transaction(tx => {
      tx.blobs.attach(session.principal, missingRef, 'listing/missing');
      tx.blobs.attach('foreign-principal', foreignRef, 'foreign/1');
      return ok(undefined);
    });
    expect(written.ok).toBe(true);
    const report = await session.attachmentCoverage();
    expect(report).toEqual({
      referencedBlobs: 1, missingBlobs: 1, excludedStoredReferences: 0,
      holderRows: 1, limitExceeded: false, holderAuthorityVerified: false, includedInV1Backup: false,
    });
    expect(JSON.stringify(report)).not.toMatch(/listing\/missing|foreign-principal|blob:sha256-/);
    expect((await session.backupCoverage()).excludedStores).toContain('blob_refs');
  } finally {
    await session.lock();
  }
  await expect(session.attachmentCoverage()).rejects.toThrow(/Vault closed|Vault locked/);
});

describe('reference coverage lifecycle does not count unheld or detached data', () => {
  for (const factory of factories) {
    it(`${factory.name}: empty, rolled-back, duplicate and detached references`, async () => {
      const storage = await factory.open();
      try {
        const tenant = 'coverage-lifecycle-owner';
        const ref = await blobRefOf(bytes);
        const empty = { referenceCount: 0, holderCount: 0, missingCount: 0, limitExceeded: false };
        expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual(empty);
        const seeded = await storage.transaction(async tx => {
          const blob = await tx.blobs.put({ tenant, bytes, contentType: 'image/png', privacy: 'P0', encrypted: false, now });
          if (!blob.ok) return blob;
          // Stored but unheld bytes are intentionally excluded from this diagnostic.
          return ok(undefined);
        });
        expect(seeded.ok).toBe(true);
        expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual(empty);
        // An aborted write must also roll back the tenant reference index.
        await expect(storage.transaction(tx => {
          tx.blobs.attach(tenant, ref, 'listing/rolled-back');
          throw new Error('intentional reference transaction rollback');
        })).rejects.toThrow('intentional reference transaction rollback');
        expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual(empty);
        const attached = await storage.transaction(tx => {
          tx.blobs.attach(tenant, ref, 'listing/lifecycle');
          tx.blobs.attach(tenant, ref, 'listing/lifecycle');
          return ok(undefined);
        });
        expect(attached.ok).toBe(true);
        expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual({
          referenceCount: 1, holderCount: 1, missingCount: 0, limitExceeded: false,
        });
        const detached = await storage.transaction(tx => {
          tx.blobs.detach(tenant, ref, 'listing/lifecycle');
          return ok(undefined);
        });
        expect(detached.ok).toBe(true);
        expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual(empty);
        // Detaching the final holder removes the blob under the existing blob lifecycle contract.
        expect(await storage.read(tx => tx.blobs.info(tenant, ref))).toBeUndefined();
      } finally {
        await storage.close();
      }
    });
  }
});
