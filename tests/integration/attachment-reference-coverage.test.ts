import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createMemoryDriver, createMemoryStorage, createStorage, err, ok, type Storage, type Tx } from '../../packages/kernel/src/index.ts';
import { openIndexedDbStorage } from '../../packages/kernel/src/storage/indexeddb.ts';
import { openSqliteStorage } from '../../packages/kernel/src/storage/sqlite.ts';
import { blobRefOf } from '../../packages/kernel/src/storage/tx.ts';
import { archiveRecordRepo, RESTORE_WINDOW_MS } from '../../packages/bazaar/src/index.ts';
import { openVault, vaultFromStorage } from '../../packages/vault/src/vault.ts';
import { archiveBackupCodec } from '../../apps/pwa/src/archive-backup.ts';
import { productionBackupCodecs } from '../../apps/pwa/src/backup-codecs.ts';

const now = Date.parse('2026-11-20T12:00:00.000Z');
const bytes = new Uint8Array([1, 2, 3, 4]);
const factories = [
  { name: 'memory', open: async () => createMemoryStorage() },
  { name: 'indexeddb', open: () => openIndexedDbStorage({ name: 'reference-coverage', indexedDB: new IDBFactory() }) },
  { name: 'sqlite', open: () => openSqliteStorage({ path: ':memory:' }) },
];

async function putHeldBlob(storage: Storage, tenant: string, holder: string): Promise<string> {
  const inserted = await storage.transaction(async tx => {
    const blob = await tx.blobs.put({ tenant, bytes, contentType: 'image/png', privacy: 'P0', encrypted: false, now });
    if (!blob.ok) return blob;
    const attached = tx.blobs.attach(tenant, blob.value.ref, holder);
    return attached.ok ? ok(blob.value.ref) : attached;
  });
  expect(inserted.ok).toBe(true);
  if (!inserted.ok) throw new Error('Held blob fixture was not saved');
  return inserted.value;
}

describe('read-only reference coverage across storage adapters', () => {
  for (const factory of factories) {
    it(`${factory.name}: counts owned, missing and foreign refs without returning identifiers or mutating rows`, async () => {
      const storage = await factory.open();
      try {
        const missingBytes = new Uint8Array([8, 9]);
        const missingRef = await blobRefOf(missingBytes);
        const inserted = await storage.transaction(async tx => {
          const owned = await tx.blobs.put({ tenant: 'owner', bytes, contentType: 'image/png', privacy: 'P0', encrypted: false, now });
          if (!owned.ok) return owned;
          const foreign = await tx.blobs.put({ tenant: 'foreign', bytes, contentType: 'image/png', privacy: 'P0', encrypted: false, now });
          if (!foreign.ok) return foreign;
          const foreignOnly = await tx.blobs.put({ tenant: 'foreign', bytes: missingBytes, contentType: 'image/png', privacy: 'P0', encrypted: false, now });
          if (!foreignOnly.ok) return foreignOnly;
          tx.blobs.attach('owner', owned.value.ref, 'listing/1');
          tx.blobs.attach('owner', owned.value.ref, 'listing/2');
          tx.blobs.attach('owner', missingRef, 'listing/missing');
          tx.blobs.attach('foreign', owned.value.ref, 'foreign/1');
          tx.blobs.attach('foreign', foreignOnly.value.ref, 'foreign/2');
          return ok(owned.value.ref);
        });
        expect(inserted.ok).toBe(true);
        if (!inserted.ok) return;
        expect(await storage.read(tx => tx.blobs.referenceCoverage('owner'))).toEqual({
          referenceCount: 2, holderCount: 3, missingCount: 1, limitExceeded: false,
        });
        expect(await storage.read(tx => tx.blobs.referenceCoverage('foreign'))).toEqual({
          referenceCount: 2, holderCount: 2, missingCount: 0, limitExceeded: false,
        });
        expect(await storage.read(tx => tx.blobs.referenceCoverage('owner', 3))).toEqual({
          referenceCount: 2, holderCount: 3, missingCount: 1, limitExceeded: false,
        });
        const truncated = await storage.read(tx => tx.blobs.referenceCoverage('owner', 2));
        expect(truncated).toEqual({ referenceCount: null, holderCount: null, missingCount: null, limitExceeded: true });
        expect(JSON.stringify(truncated)).not.toContain(inserted.value);
        await storage.read(tx => {
          for (const limit of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 10001]) {
            expect(() => tx.blobs.referenceCoverage('owner', limit)).toThrow(RangeError);
          }
          expect(tx.blobs.info('owner', inserted.value)?.holders).toBe(2);
          expect(tx.blobs.info('foreign', inserted.value)?.holders).toBe(1);
          expect(tx.blobs.info('owner', missingRef)).toBeUndefined();
          expect(tx.blobs.get('foreign', missingRef)?.bytes).toEqual(missingBytes);
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
        expect(await storage.read(tx => tx.blobs.get(tenant, ref)?.bytes)).toEqual(bytes);
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
        expect(await storage.read(tx => tx.blobs.get(tenant, ref)?.bytes)).toEqual(bytes);
        const detached = await storage.transaction(tx => {
          return ok(tx.blobs.detach(tenant, ref, 'listing/lifecycle'));
        });
        expect(detached).toEqual(ok({ deleted: true, shred: false }));
        expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual(empty);
        // Detaching the final holder removes the blob under the existing blob lifecycle contract.
        expect(await storage.read(tx => tx.blobs.info(tenant, ref))).toBeUndefined();
      } finally {
        await storage.close();
      }
    });
  }
});

describe('reference coverage respects transaction outcomes and lifetimes', () => {
  for (const factory of factories) {
    it(`${factory.name}: rolls back last-holder removal and a missing reference before a successful retry`, async () => {
      const storage = await factory.open();
      try {
        const tenant = 'coverage-rollback-owner';
        const holder = 'listing/original';
        const ref = await putHeldBlob(storage, tenant, holder);
        const missingRef = await blobRefOf(new Uint8Array([4, 8, 12]));
        const original = { referenceCount: 1, holderCount: 1, missingCount: 0, limitExceeded: false };
        const replacement = { referenceCount: 1, holderCount: 1, missingCount: 1, limitExceeded: false };
        const replace = (tx: Tx): void => {
          expect(tx.blobs.detach(tenant, ref, holder)).toEqual({ deleted: true, shred: false });
          expect(tx.blobs.attach(tenant, missingRef, 'listing/replacement')).toEqual(ok({ holders: 1, present: false }));
          expect(tx.blobs.referenceCoverage(tenant)).toEqual(replacement);
        };
        expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual(original);
        const cancelled = await storage.transaction(tx => {
          replace(tx);
          return err('cancelled reference edit');
        });
        expect(cancelled).toEqual(err('cancelled reference edit'));
        expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual(original);
        expect(await storage.read(tx => tx.blobs.get(tenant, ref)?.bytes)).toEqual(bytes);
        expect(await storage.read(tx => tx.blobs.info(tenant, ref)?.holders)).toBe(1);
        expect(await storage.read(tx => tx.blobs.info(tenant, missingRef))).toBeUndefined();

        const retried = await storage.transaction(tx => {
          replace(tx);
          return ok(undefined);
        });
        expect(retried.ok).toBe(true);
        expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual(replacement);
        expect(await storage.read(tx => tx.blobs.info(tenant, ref))).toBeUndefined();
      } finally {
        await storage.close();
      }
    });

    it(`${factory.name}: revokes retained coverage calls after their transaction and inside a later transaction`, async () => {
      const storage = await factory.open();
      try {
        const tenant = 'coverage-lifetime-owner';
        await putHeldBlob(storage, tenant, 'listing/lifetime');
        const expected = { referenceCount: 1, holderCount: 1, missingCount: 0, limitExceeded: false };
        let retained!: Tx['blobs']['referenceCoverage'];
        await storage.read(tx => {
          retained = tx.blobs.referenceCoverage;
          expect(retained(tenant)).toEqual(expected);
        });
        expect(() => retained(tenant)).toThrow('Transaction is no longer active');
        await storage.read(tx => {
          expect(tx.blobs.referenceCoverage(tenant)).toEqual(expected);
          expect(() => retained(tenant)).toThrow('Transaction is no longer active');
        });
      } finally {
        await storage.close();
      }
    });
  }
});

it('restores coverage and blob bytes after rejected memory persistence, then permits retry', async () => {
  let rejectNextCommit = false;
  let persistCalls = 0;
  const storage = createStorage(createMemoryDriver({
    persist: async () => {
      persistCalls++;
      if (rejectNextCommit) {
        rejectNextCommit = false;
        throw new Error('reference coverage persistence fixture failed');
      }
    },
  }));
  try {
    const tenant = 'coverage-persistence-owner';
    const holder = 'listing/original';
    const ref = await putHeldBlob(storage, tenant, holder);
    const missingRef = await blobRefOf(new Uint8Array([5, 10, 15]));
    const original = { referenceCount: 1, holderCount: 1, missingCount: 0, limitExceeded: false };
    const replacement = { referenceCount: 1, holderCount: 1, missingCount: 1, limitExceeded: false };
    const replace = (tx: Tx): void => {
      expect(tx.blobs.detach(tenant, ref, holder)).toEqual({ deleted: true, shred: false });
      expect(tx.blobs.attach(tenant, missingRef, 'listing/replacement')).toEqual(ok({ holders: 1, present: false }));
      expect(tx.blobs.referenceCoverage(tenant)).toEqual(replacement);
    };
    expect(persistCalls).toBe(1);
    rejectNextCommit = true;
    await expect(storage.transaction(tx => {
      replace(tx);
      return ok(undefined);
    })).rejects.toThrow('reference coverage persistence fixture failed');
    expect(persistCalls).toBe(2);
    expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual(original);
    expect(await storage.read(tx => tx.blobs.get(tenant, ref)?.bytes)).toEqual(bytes);
    expect(await storage.read(tx => tx.blobs.info(tenant, ref)?.holders)).toBe(1);
    expect(await storage.read(tx => tx.blobs.info(tenant, missingRef))).toBeUndefined();

    const retried = await storage.transaction(tx => {
      replace(tx);
      return ok(undefined);
    });
    expect(retried.ok).toBe(true);
    expect(persistCalls).toBe(3);
    expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual(replacement);
    expect(await storage.read(tx => tx.blobs.info(tenant, ref))).toBeUndefined();
  } finally {
    await storage.close();
  }
});

it('reconstructs encrypted reference coverage on reopen while v1 recovery remains record-only', async () => {
  const indexedDB = new IDBFactory();
  const clock = { now: () => now, iso: () => new Date(now).toISOString() };
  const passphrase = 'encrypted attachment reference lifecycle acceptance';
  const sourceName = 'encrypted-attachment-coverage-source';
  const source = await openVault({ name: sourceName, indexedDB, clock, codecs: productionBackupCodecs });
  const opened = [source];
  try {
    const original = await source.create(passphrase);
    const principal = original.principal;
    const foreignTenant = 'attachment-coverage-foreign-principal';
    const missingBytes = new Uint8Array([9, 8, 7, 6]);
    const missingRef = await blobRefOf(missingBytes);
    const message = new TextEncoder().encode('attachment diagnostic preserves signing identity');
    const signature = await original.identity.sign(message);
    const archiveId = '0195aaaa-0000-7000-8000-000000000051';
    const archivedAt = clock.iso();
    const restoreUntil = new Date(now + RESTORE_WINDOW_MS).toISOString();
    const archive = {
      listingId: archiveId, ownerId: principal, status: 'archived' as const,
      endedAt: archivedAt, archivedAt, restoreUntil, purgeAt: restoreUntil,
    };
    const inserted = await original.storage.transaction(async tx => {
      const record = tx.records.put({ tenant: principal, type: archiveRecordRepo.type, id: archiveId,
        data: archive, idx: archiveBackupCodec.indexes(archive), expectedRevision: 0, now });
      if (!record.ok) return record;
      const owned = await tx.blobs.put({ tenant: principal, bytes, contentType: 'image/png', privacy: 'P3', encrypted: false, now });
      if (!owned.ok) return owned;
      const foreign = await tx.blobs.put({ tenant: foreignTenant, bytes: missingBytes, contentType: 'image/png', privacy: 'P3', encrypted: false, now });
      if (!foreign.ok) return foreign;
      tx.blobs.attach(principal, owned.value.ref, 'listing/owner-one');
      tx.blobs.attach(principal, owned.value.ref, 'listing/owner-two');
      tx.blobs.attach(principal, missingRef, 'listing/owner-missing');
      tx.blobs.attach(foreignTenant, foreign.value.ref, 'listing/foreign');
      return ok(owned.value.ref);
    });
    expect(inserted.ok).toBe(true);
    if (!inserted.ok) throw new Error('Encrypted attachment fixture was not saved');
    const expected = {
      referencedBlobs: 2, missingBlobs: 1, excludedStoredReferences: 1,
      holderRows: 3, limitExceeded: false, holderAuthorityVerified: false, includedInV1Backup: false,
    };
    const report = await original.attachmentCoverage();
    expect(report).toEqual(expected);
    expect(Object.isFrozen(report)).toBe(true);
    expect(JSON.stringify(report)).not.toMatch(/blob:sha256-|listing\/|image\/png|attachment-coverage-foreign-principal/);
    expect(JSON.stringify(report)).not.toContain(principal);
    const before = await original.backupCoverage();
    expect(before.recordTypes).toEqual([{ type: archiveRecordRepo.type, count: 1 }]);
    expect(before.excludedStores).toEqual(expect.arrayContaining(['blobs', 'blob_refs']));
    const backup = await original.exportBackup(passphrase);
    expect(await original.attachmentCoverage()).toEqual(expected);
    expect(await original.storage.read(tx => tx.blobs.get(principal, inserted.value)?.bytes)).toEqual(bytes);
    await original.lock();
    await expect(original.attachmentCoverage()).rejects.toThrow(/Vault closed|Vault locked/);

    const reopened = await openVault({ name: sourceName, indexedDB, clock, codecs: productionBackupCodecs });
    opened.push(reopened);
    const fresh = await reopened.unlock(passphrase);
    expect(fresh.principal).toBe(principal);
    expect(await fresh.identity.sign(message)).toEqual(signature);
    const reconstructed = await fresh.attachmentCoverage();
    expect(reconstructed).toEqual(expected);
    expect(Object.isFrozen(reconstructed)).toBe(true);
    expect(await fresh.storage.read(tx => tx.blobs.get(principal, inserted.value)?.bytes)).toEqual(bytes);
    expect(await fresh.storage.read(tx => tx.blobs.info(principal, missingRef))).toBeUndefined();
    expect(await fresh.storage.read(tx => tx.blobs.get(foreignTenant, missingRef)?.bytes)).toEqual(missingBytes);

    const destination = await openVault({ name: 'encrypted-attachment-coverage-restored', indexedDB, clock, codecs: productionBackupCodecs });
    opened.push(destination);
    const restored = await destination.restoreBackup(backup, passphrase);
    expect(restored.principal).toBe(principal);
    expect(await restored.identity.sign(message)).toEqual(signature);
    expect(await restored.storage.read(tx => tx.records.get(principal, archiveRecordRepo.type, archiveId)?.data)).toEqual(archive);
    expect((await restored.backupCoverage()).recordTypes).toEqual(before.recordTypes);
    expect(await restored.attachmentCoverage()).toEqual({
      referencedBlobs: 0, missingBlobs: 0, excludedStoredReferences: 0,
      holderRows: 0, limitExceeded: false, holderAuthorityVerified: false, includedInV1Backup: false,
    });
    expect(await restored.storage.read(tx => tx.blobs.referenceCoverage(foreignTenant))).toEqual({
      referenceCount: 0, holderCount: 0, missingCount: 0, limitExceeded: false,
    });
    expect(await restored.storage.read(tx => tx.blobs.info(principal, inserted.value))).toBeUndefined();
    expect(await restored.storage.read(tx => tx.blobs.info(foreignTenant, missingRef))).toBeUndefined();
    expect(await fresh.attachmentCoverage()).toEqual(expected);
  } finally {
    for (const vault of opened.reverse()) await vault.close();
  }
}, 30000);

it('rejects a queued diagnostic once session lock starts', async () => {
  const raw = createMemoryStorage();
  const vault = vaultFromStorage(raw);
  let release!: () => void;
  let entered!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const ready = new Promise<void>(resolve => { entered = resolve; });
  let blocker: Promise<void> | undefined;
  let rejection: Promise<unknown> | undefined;
  let locking: Promise<void> | undefined;
  try {
    const session = await vault.create('queued attachment diagnostic session acceptance');
    const missingRef = await blobRefOf(new Uint8Array([3, 6, 9]));
    expect((await session.storage.transaction(tx => tx.blobs.attach(session.principal, missingRef, 'listing/queued'))).ok).toBe(true);
    blocker = raw.read(async () => { entered(); await held; });
    await ready;
    const pending = session.attachmentCoverage();
    rejection = expect(pending).rejects.toThrow(/Vault closed|Vault locked/);
    locking = session.lock();
    release();
    await Promise.all([blocker, rejection, locking]);
    await expect(session.attachmentCoverage()).rejects.toThrow(/Vault closed|Vault locked/);
  } finally {
    release();
    await Promise.allSettled([blocker, rejection, locking]);
    await vault.close();
  }
});

it('IndexedDB reference coverage reconstructs its tenant index after reopening', async () => {
  const indexedDB = new IDBFactory();
  const name = 'reference-coverage-reopen';
  const tenant = 'reopened-owner';
  const ref = await blobRefOf(new Uint8Array([4, 5, 6]));
  const original = await openIndexedDbStorage({ name, indexedDB });
  try {
    const created = await original.transaction(tx => {
      tx.blobs.attach(tenant, ref, 'listing/reopened');
      tx.blobs.attach('other-owner', ref, 'listing/foreign');
      return ok(undefined);
    });
    expect(created.ok).toBe(true);
  } finally {
    await original.close();
  }
  const reopened = await openIndexedDbStorage({ name, indexedDB });
  try {
    expect(await reopened.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual({
      referenceCount: 1, holderCount: 1, missingCount: 1, limitExceeded: false,
    });
    expect(await reopened.read(tx => tx.blobs.referenceCoverage('other-owner'))).toEqual({
      referenceCount: 1, holderCount: 1, missingCount: 1, limitExceeded: false,
    });
  } finally {
    await reopened.close();
  }
});

it('reverts the tenant holder index after a failed durable write and accepts a clean retry', async () => {
  // IndexedDB uses this journalled memory working set with an asynchronous
  // persist callback. Reject the callback after the in-memory changes are staged.
  let failPersist = true;
  let persistAttempts = 0;
  const storage = createStorage(createMemoryDriver({
    kind: 'indexeddb',
    persist: async () => {
      persistAttempts++;
      if (failPersist) throw new Error('simulated persistence failure');
    },
  }));
  const tenant = 'persist-failure-owner';
  const foreign = 'persist-failure-foreign';
  const ref = await blobRefOf(new Uint8Array([11, 22, 33]));
  const empty = { referenceCount: 0, holderCount: 0, missingCount: 0, limitExceeded: false };
  try {
    await expect(storage.transaction(tx => {
      tx.blobs.attach(tenant, ref, 'owner/rolled-back');
      tx.blobs.attach(foreign, ref, 'foreign/rolled-back');
      return ok(undefined);
    })).rejects.toThrow('simulated persistence failure');
    expect(persistAttempts).toBe(1);
    expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual(empty);
    expect(await storage.read(tx => tx.blobs.referenceCoverage(foreign))).toEqual(empty);

    failPersist = false;
    const retried = await storage.transaction(tx => {
      tx.blobs.attach(tenant, ref, 'owner/retried');
      return ok(undefined);
    });
    expect(retried.ok).toBe(true);
    expect(persistAttempts).toBe(2);
    expect(await storage.read(tx => tx.blobs.referenceCoverage(tenant))).toEqual({
      referenceCount: 1, holderCount: 1, missingCount: 1, limitExceeded: false,
    });
    expect(await storage.read(tx => tx.blobs.referenceCoverage(foreign))).toEqual(empty);
  } finally {
    await storage.close();
  }
}, 30000);

it('restores stored bytes and both tenant holder indexes when final-holder deletion cannot persist', async () => {
  let failDeletion = false;
  let persistAttempts = 0;
  const storage = createStorage(createMemoryDriver({
    kind: 'indexeddb',
    persist: async () => {
      persistAttempts++;
      if (failDeletion) throw new Error('simulated deletion persistence failure');
    },
  }));
  const owner = 'persist-delete-owner';
  const foreign = 'persist-delete-foreign';
  const empty = { referenceCount: 0, holderCount: 0, missingCount: 0, limitExceeded: false };
  const ownerCounts = { referenceCount: 1, holderCount: 2, missingCount: 0, limitExceeded: false };
  const foreignCounts = { referenceCount: 1, holderCount: 1, missingCount: 1, limitExceeded: false };
  try {
    const seeded = await storage.transaction(async tx => {
      const added = await tx.blobs.put({ tenant: owner, bytes, contentType: 'image/png',
        privacy: 'P0', encrypted: false, now });
      if (!added.ok) return added;
      tx.blobs.attach(owner, added.value.ref, 'owner/first');
      tx.blobs.attach(owner, added.value.ref, 'owner/last');
      // No foreign blob is present; the same address must remain tenant-specific.
      tx.blobs.attach(foreign, added.value.ref, 'foreign/holder');
      return ok(added.value.ref);
    });
    expect(seeded.ok).toBe(true);
    if (!seeded.ok) throw new Error('blob seed failed');
    const ref = seeded.value;
    expect(persistAttempts).toBe(1);
    expect(await storage.read(tx => tx.blobs.referenceCoverage(owner))).toEqual(ownerCounts);
    expect(await storage.read(tx => tx.blobs.referenceCoverage(foreign))).toEqual(foreignCounts);
    failDeletion = true;
    await expect(storage.transaction(tx => {
      tx.blobs.detach(owner, ref, 'owner/first');
      // This last-holder detach stages deletion of the stored bytes as well.
      expect(tx.blobs.detach(owner, ref, 'owner/last')).toEqual({ deleted: true, shred: false });
      tx.blobs.detach(foreign, ref, 'foreign/holder');
      return ok(undefined);
    })).rejects.toThrow('simulated deletion persistence failure');
    expect(persistAttempts).toBe(2);
    expect(await storage.read(tx => tx.blobs.referenceCoverage(owner))).toEqual(ownerCounts);
    expect(await storage.read(tx => tx.blobs.referenceCoverage(foreign))).toEqual(foreignCounts);
    expect(await storage.read(tx => tx.blobs.info(owner, ref)?.holders)).toBe(2);
    expect(await storage.read(tx => [...(tx.blobs.get(owner, ref)?.bytes ?? [])])).toEqual([...bytes]);
    expect(await storage.read(tx => tx.blobs.info(foreign, ref))).toBeUndefined();

    failDeletion = false;
    const retried = await storage.transaction(tx => {
      tx.blobs.detach(owner, ref, 'owner/first');
      return ok(undefined);
    });
    expect(retried.ok).toBe(true);
    expect(persistAttempts).toBe(3);
    expect(await storage.read(tx => tx.blobs.referenceCoverage(owner))).toEqual({
      referenceCount: 1, holderCount: 1, missingCount: 0, limitExceeded: false,
    });
    expect(await storage.read(tx => tx.blobs.referenceCoverage(foreign))).toEqual(foreignCounts);
    expect(await storage.read(tx => tx.blobs.info(owner, ref)?.holders)).toBe(1);
    expect(await storage.read(tx => tx.blobs.referenceCoverage('unrelated'))).toEqual(empty);
  } finally {
    await storage.close();
  }
}, 30000);
