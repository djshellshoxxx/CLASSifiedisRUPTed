import { describe, expect, it } from 'vitest';
import { createMemoryDriver, createMemoryStorage, createStorage, defineRepo, readVerifiedBlobBatch, z } from '../../packages/kernel/src/index.ts';
import { backupCodec, vaultFromStorage } from '../../packages/vault/src/vault.ts';
import { verifySealedAttachmentManifest } from '../../packages/vault/src/attachment-manifest.ts';

const password = 'public-attachment-acceptance-passphrase';
const date = Date.parse('2026-11-23T00:00:00.000Z');
const repo = defineRepo({ type: 'test.public_owner_retirement_rollback',
  schema: z.strictObject({ id: z.string(), ref: z.string() }), indexes: {} });
const codec = { ...backupCodec(repo),
  recordId: (data: unknown) => repo.schema.parse(data).id,
  attachmentRefs: (data: unknown) => [repo.schema.parse(data).ref] };

describe('public attachment owner retirement persistence rollback', () => {
  it('rolls back late persistence rejection and retries the entire authorized import', async () => {
    const source = await vaultFromStorage(createMemoryStorage(), [codec]).create(password);
    try {
      const seeded = await source.storage.transaction(async tx => {
        const first = await tx.blobs.put({ tenant: source.principal, bytes: Uint8Array.of(7, 8, 9),
          contentType: 'image/png', privacy: 'P0', encrypted: false, now: date });
        if (!first.ok) return first;
        const second = await tx.blobs.put({ tenant: source.principal, bytes: Uint8Array.of(10, 11, 12),
          contentType: 'image/png', privacy: 'P0', encrypted: false, now: date });
        if (!second.ok) return second;
        const a = tx.records.put({ tenant: source.principal, type: repo.type, id: 'a',
          data: { id: 'a', ref: second.value.ref }, idx: [null, null, null, null],
          expectedRevision: 0, now: date });
        if (!a.ok) return a;
        return tx.records.put({ tenant: source.principal, type: repo.type, id: 'b',
          data: { id: 'b', ref: first.value.ref }, idx: [null, null, null, null],
          expectedRevision: 0, now: date });
      });
      expect(seeded.ok).toBe(true);
      const archive = await source.exportBackup(password);
      const sealed = await source.exportAttachmentManifest(password);
      const manifest = await verifySealedAttachmentManifest(sealed, password, source.principal);
      const retainedRef = manifest.parents.find(parent => parent.id === 'b')!.refs[0]!;
      const bytes = (await readVerifiedBlobBatch(source.storage, source.principal,
        manifest.blobs.map(blob => blob.ref))).map(blob => new Uint8Array(blob.bytes));
      const missingRef = manifest.parents.find(parent => parent.id === 'a')!.refs[0]!;
      let rejectCommit = false;
      let rejectedCommits = 0;
      const persistFailure = new Error('controlled late persistence rejection');
      const driver = createMemoryDriver({
        async persist(changes) {
          if (!rejectCommit) return;
          rejectedCommits += 1;
          // This callback runs after the working-set transaction has staged
          // both a new blob and the stale holder removal, not during admission.
          expect(changes.some(change => change.table === 'blobs' && change.row !== undefined)).toBe(true);
          expect(changes.some(change => change.table === 'blob_refs' && change.row === undefined)).toBe(true);
          expect(changes.filter(change => change.table === 'blob_refs' && change.row !== undefined)).toHaveLength(2);
          throw persistFailure;
        },
      });
      const dest = await vaultFromStorage(createStorage(driver), [codec]).restoreBackup(archive, password);
      try {
        const stale = { type: repo.type, id: 'a', ref: retainedRef };
        const staleLabel = 'classrup.attachment_owner/v1:' + JSON.stringify([repo.type, 'a']);
        const currentLabel = 'classrup.attachment_owner/v1:' + JSON.stringify([repo.type, 'b']);
        const registered = await dest.storage.transaction(async tx => {
          const stored = await tx.blobs.put({ tenant: dest.principal, bytes: Uint8Array.of(7, 8, 9),
            contentType: 'image/png', privacy: 'P0', encrypted: false, now: date });
          if (!stored.ok) return stored;
          expect(stored.value.ref).toBe(retainedRef);
          const old = tx.blobs.attach(dest.principal, retainedRef, staleLabel);
          if (!old.ok) return old;
          return tx.blobs.attach(dest.principal, retainedRef, 'external-retention');
        });
        expect(registered.ok).toBe(true);
        const snapshot = () => dest.storage.read(tx => ({
          retained: tx.blobs.get(dest.principal, retainedRef),
          missing: tx.blobs.get(dest.principal, missingRef),
          coverage: tx.blobs.referenceCoverage(dest.principal),
        }));
        const before = await snapshot();
        expect(before.retained?.bytes).toEqual(Uint8Array.of(7, 8, 9));
        expect(before.retained?.holders).toBe(2);
        expect(before.missing).toBeUndefined();
        expect(before.coverage).toMatchObject({ referenceCount: 1, holderCount: 2, missingCount: 0 });

        rejectCommit = true;
        try {
          await expect(dest.importPublicAttachmentBatch(sealed, password, bytes, stale)).rejects.toBe(persistFailure);
        } finally {
          rejectCommit = false;
        }
        expect(rejectedCommits).toBe(1);
        expect(await snapshot()).toEqual(before);
        // Verify actual labels, not just the restored count. Abort this
        // observation transaction so it cannot repair the state before retry.
        const observationEnd = new Error('rollback holder observation');
        await expect(dest.storage.transaction(tx => {
          const old = tx.blobs.attach(dest.principal, retainedRef, staleLabel);
          if (!old.ok) throw new Error('stale holder observation failed');
          expect(old.value.holders).toBe(2);
          const external = tx.blobs.attach(dest.principal, retainedRef, 'external-retention');
          if (!external.ok) throw new Error('external holder observation failed');
          expect(external.value.holders).toBe(2);
          const current = tx.blobs.attach(dest.principal, retainedRef, currentLabel);
          if (!current.ok) throw new Error('current holder observation failed');
          expect(current.value.holders).toBe(3);
          throw observationEnd;
        })).rejects.toBe(observationEnd);
        expect(await snapshot()).toEqual(before);
        await dest.importPublicAttachmentBatch(sealed, password, bytes, stale);
        const after = await snapshot();
        expect(after.retained?.bytes).toEqual(Uint8Array.of(7, 8, 9));
        expect(after.retained?.holders).toBe(2);
        expect(after.missing?.bytes).toEqual(Uint8Array.of(10, 11, 12));
        expect(after.missing?.holders).toBe(1);
        expect(after.coverage).toMatchObject({ referenceCount: 2, holderCount: 3, missingCount: 0 });
        await expect(dest.storage.transaction(tx => {
          const current = tx.blobs.attach(dest.principal, retainedRef, currentLabel);
          if (!current.ok) throw new Error('current holder observation failed');
          expect(current.value.holders).toBe(2);
          const external = tx.blobs.attach(dest.principal, retainedRef, 'external-retention');
          if (!external.ok) throw new Error('external holder observation failed');
          expect(external.value.holders).toBe(2);
          const old = tx.blobs.attach(dest.principal, retainedRef, staleLabel);
          if (!old.ok) throw new Error('stale holder observation failed');
          expect(old.value.holders).toBe(3);
          throw observationEnd;
        })).rejects.toBe(observationEnd);
        expect(await snapshot()).toEqual(after);
      } finally { await dest.lock(); }
    } finally { await source.lock(); }
  }, 30000);
});
