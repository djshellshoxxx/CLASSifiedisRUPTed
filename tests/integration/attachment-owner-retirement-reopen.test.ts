import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createMemoryStorage, defineRepo, readVerifiedBlobBatch, z } from '../../packages/kernel/src/index.ts';
import { backupCodec, openVault, vaultFromStorage } from '../../packages/vault/src/vault.ts';
import { verifySealedAttachmentManifest } from '../../packages/vault/src/attachment-manifest.ts';

const password = 'public-attachment-acceptance-passphrase';
const date = Date.parse('2026-11-23T00:00:00.000Z');
const repo = defineRepo({ type: 'test.public_owner_retirement_reopen',
  schema: z.strictObject({ id: z.string(), ref: z.string() }), indexes: {} });
const codec = { ...backupCodec(repo),
  recordId: (data: unknown) => repo.schema.parse(data).id,
  attachmentRefs: (data: unknown) => [repo.schema.parse(data).ref] };

describe('public attachment owner retirement encrypted reopen', () => {
  it('persists retirement, current ownership and unmanaged retention through encrypted reopen', async () => {
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
      const indexedDB = new IDBFactory();
      const open = () => openVault({ name: 'public-owner-retirement-reopen', indexedDB, codecs: [codec] });
      let dest = await (await open()).restoreBackup(archive, password);
      try {
        const stale = { type: repo.type, id: 'a', ref: retainedRef };
        const staleLabel = 'classrup.attachment_owner/v1:' + JSON.stringify([repo.type, 'a']);
        const registered = await dest.storage.transaction(tx => {
          // Simulate a stale legacy holder and an unmanaged holder, with the
          // actual current canonical owner not yet registered.
          const a = tx.blobs.attach(dest.principal, retainedRef, staleLabel);
          if (!a.ok) return a;
          return tx.blobs.attach(dest.principal, retainedRef, 'external-retention');
        });
        expect(registered.ok).toBe(true);
        await expect(dest.importPublicAttachmentBatch(sealed, password, bytes,
          { type: repo.type, id: 'b', ref: retainedRef })).rejects.toThrow(/retirement not authorized/);
        expect(await dest.storage.read(tx => tx.blobs.get(dest.principal, retainedRef))).toBeUndefined();
        await dest.importPublicAttachmentBatch(sealed, password, bytes, stale);
        await dest.importPublicAttachmentBatch(sealed, password, bytes, stale);
        await dest.lock();
        dest = await (await open()).unlock(password);
        expect(dest.principal).toBe(source.principal);
        const actual = await dest.storage.read(tx => tx.blobs.get(dest.principal, retainedRef));
        expect(actual?.bytes).toEqual(Uint8Array.of(7, 8, 9));
        expect(actual?.holders).toBe(2);
        // A no-op reattach proves the unmanaged and current managed labels
        // survived; the retired label is absent and can be added anew.
        const checked = await dest.storage.transaction(tx => {
          const unmanaged = tx.blobs.attach(dest.principal, retainedRef, 'external-retention');
          if (!unmanaged.ok) return unmanaged;
          expect(unmanaged.value.holders).toBe(2);
          const current = tx.blobs.attach(dest.principal, retainedRef,
            'classrup.attachment_owner/v1:' + JSON.stringify([repo.type, 'b']));
          if (!current.ok) return current;
          expect(current.value.holders).toBe(2);
          const retired = tx.blobs.attach(dest.principal, retainedRef, staleLabel);
          if (!retired.ok) return retired;
          expect(retired.value.holders).toBe(3);
          return retired;
        });
        expect(checked.ok).toBe(true);
        // Retirement must remain authorized and idempotent after reopen.
        await dest.importPublicAttachmentBatch(sealed, password, bytes, stale);
        const again = await dest.storage.read(tx => tx.blobs.get(dest.principal, retainedRef));
        expect(again?.bytes).toEqual(Uint8Array.of(7, 8, 9));
        expect(again?.holders).toBe(2);
      } finally { await dest.lock(); }
    } finally { await source.lock(); }
  }, 30000);
});
