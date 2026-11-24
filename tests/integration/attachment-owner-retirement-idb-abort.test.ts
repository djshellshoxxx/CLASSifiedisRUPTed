import { describe, expect, it } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { createMemoryStorage, defineRepo, readVerifiedBlobBatch, z } from '../../packages/kernel/src/index.ts';
import { backupCodec, openVault, vaultFromStorage } from '../../packages/vault/src/vault.ts';
import { verifySealedAttachmentManifest } from '../../packages/vault/src/attachment-manifest.ts';

const password = 'public-attachment-abort-acceptance-passphrase';
const date = Date.parse('2026-11-23T00:00:00.000Z');
const repo = defineRepo({ type: 'test.public_owner_retirement_idb_abort',
  schema: z.strictObject({ id: z.string(), ref: z.string() }), indexes: {} });
const codec = { ...backupCodec(repo),
  recordId: (data: unknown) => repo.schema.parse(data).id,
  attachmentRefs: (data: unknown) => [repo.schema.parse(data).ref] };

describe('public attachment owner retirement on IndexedDB abort', () => {
  it('keeps durable bytes and exact holder labels unchanged after a real IDB transaction abort, then retries', async () => {
    const source = await vaultFromStorage(createMemoryStorage(), [codec]).create(password);
    try {
      const seeded = await source.storage.transaction(async tx => {
        const kept = await tx.blobs.put({ tenant: source.principal, bytes: Uint8Array.of(7, 8, 9),
          contentType: 'image/png', privacy: 'P0', encrypted: false, now: date });
        if (!kept.ok) return kept;
        const additional = await tx.blobs.put({ tenant: source.principal, bytes: Uint8Array.of(10, 11, 12),
          contentType: 'image/png', privacy: 'P0', encrypted: false, now: date });
        if (!additional.ok) return additional;
        const a = tx.records.put({ tenant: source.principal, type: repo.type, id: 'a',
          data: { id: 'a', ref: additional.value.ref }, idx: [null, null, null, null],
          expectedRevision: 0, now: date });
        if (!a.ok) return a;
        return tx.records.put({ tenant: source.principal, type: repo.type, id: 'b',
          data: { id: 'b', ref: kept.value.ref }, idx: [null, null, null, null],
          expectedRevision: 0, now: date });
      });
      expect(seeded.ok).toBe(true);
      const backup = await source.exportBackup(password);
      const sealed = await source.exportAttachmentManifest(password);
      const manifest = await verifySealedAttachmentManifest(sealed, password, source.principal);
      const retainedRef = manifest.parents.find(parent => parent.id === 'b')!.refs[0]!;
      const addedRef = manifest.parents.find(parent => parent.id === 'a')!.refs[0]!;
      const bytes = (await readVerifiedBlobBatch(source.storage, source.principal,
        manifest.blobs.map(blob => blob.ref))).map(blob => new Uint8Array(blob.bytes));
      const factory = new IDBFactory();
      const open = () => openVault({ name: 'public-owner-retirement-idb-abort', indexedDB: factory, codecs: [codec] });
      let dest = await (await open()).restoreBackup(backup, password);
      try {
        const stale = { type: repo.type, id: 'a', ref: retainedRef };
        const staleLabel = 'classrup.attachment_owner/v1:' + JSON.stringify([repo.type, 'a']);
        const currentLabel = 'classrup.attachment_owner/v1:' + JSON.stringify([repo.type, 'b']);
        const seededDest = await dest.storage.transaction(async tx => {
          const blob = await tx.blobs.put({ tenant: dest.principal, bytes: Uint8Array.of(7, 8, 9),
            contentType: 'image/png', privacy: 'P0', encrypted: false, now: date });
          if (!blob.ok) return blob;
          expect(blob.value.ref).toBe(retainedRef);
          const old = tx.blobs.attach(dest.principal, retainedRef, staleLabel);
          if (!old.ok) return old;
          return tx.blobs.attach(dest.principal, retainedRef, 'external-retention');
        });
        expect(seededDest.ok).toBe(true);
        const snapshot = () => dest.storage.read(tx => ({
          retained: tx.blobs.get(dest.principal, retainedRef),
          added: tx.blobs.get(dest.principal, addedRef),
          coverage: tx.blobs.referenceCoverage(dest.principal),
        }));
        const before = await snapshot();
        expect(before.retained?.bytes).toEqual(Uint8Array.of(7, 8, 9));
        expect(before.retained?.holders).toBe(2);
        expect(before.added).toBeUndefined();

        // Instrument ONLY this test's fake-indexeddb object-store method. The
        // abort is raised by the actual IDBTransaction, after a blob_refs
        // deletion has been queued, rather than by the memory persist seam.
        const originalDelete = IDBObjectStore.prototype.delete;
        let armed = true;
        let aborts = 0;
        let abortError: unknown;
        IDBObjectStore.prototype.delete = function (key) {
          const requested = originalDelete.call(this, key);
          if (armed && this.name === 'blob_refs') {
            armed = false;
            aborts += 1;
            const tx = this.transaction;
            queueMicrotask(() => {
              try { tx.abort(); } catch (error) { abortError = error; }
            });
          }
          return requested;
        };
        try {
          await expect(dest.importPublicAttachmentBatch(sealed, password, bytes, stale)).rejects.toThrow();
        } finally {
          armed = false;
          IDBObjectStore.prototype.delete = originalDelete;
        }
        expect(aborts).toBe(1);
        expect(abortError).toBeUndefined();
        expect(await snapshot()).toEqual(before);

        // Reopen the encrypted database to verify that the failed transaction
        // did not persist a partial blob, retirement or inventory update.
        await dest.lock();
        dest = await (await open()).unlock(password);
        expect(dest.principal).toBe(source.principal);
        expect(await snapshot()).toEqual(before);
        const observationEnd = new Error('holder observation rolled back');
        await expect(dest.storage.transaction(tx => {
          const old = tx.blobs.attach(dest.principal, retainedRef, staleLabel);
          if (!old.ok) throw new Error('stale label observation failed');
          expect(old.value.holders).toBe(2);
          const external = tx.blobs.attach(dest.principal, retainedRef, 'external-retention');
          if (!external.ok) throw new Error('external label observation failed');
          expect(external.value.holders).toBe(2);
          const current = tx.blobs.attach(dest.principal, retainedRef, currentLabel);
          if (!current.ok) throw new Error('current label observation failed');
          expect(current.value.holders).toBe(3);
          throw observationEnd;
        })).rejects.toBe(observationEnd);
        expect(await snapshot()).toEqual(before);

        await dest.importPublicAttachmentBatch(sealed, password, bytes, stale);
        const after = await snapshot();
        expect(after.retained?.bytes).toEqual(Uint8Array.of(7, 8, 9));
        expect(after.retained?.holders).toBe(2);
        expect(after.added?.bytes).toEqual(Uint8Array.of(10, 11, 12));
        expect(after.added?.holders).toBe(1);
        expect(after.coverage).toMatchObject({ referenceCount: 2, holderCount: 3, missingCount: 0 });
        await expect(dest.storage.transaction(tx => {
          const current = tx.blobs.attach(dest.principal, retainedRef, currentLabel);
          if (!current.ok) throw new Error('current label observation failed');
          expect(current.value.holders).toBe(2);
          const external = tx.blobs.attach(dest.principal, retainedRef, 'external-retention');
          if (!external.ok) throw new Error('external label observation failed');
          expect(external.value.holders).toBe(2);
          const old = tx.blobs.attach(dest.principal, retainedRef, staleLabel);
          if (!old.ok) throw new Error('stale label observation failed');
          expect(old.value.holders).toBe(3);
          throw observationEnd;
        })).rejects.toBe(observationEnd);
        expect(await snapshot()).toEqual(after);
      } finally { await dest.lock(); }
    } finally { await source.lock(); }
  }, 30000);
});
