import { describe, expect, it } from 'vitest';
import { createMemoryStorage, defineRepo, readVerifiedBlobBatch, z } from '../../packages/kernel/src/index.ts';
import { backupCodec, vaultFromStorage } from '../../packages/vault/src/vault.ts';
import { verifySealedAttachmentManifest } from '../../packages/vault/src/attachment-manifest.ts';

const password = 'public-import-private-dedupe-guard';
const now = Date.parse('2026-11-23T00:00:00.000Z');
const repo = defineRepo({ type: 'test.public_import_dedupe',
  schema: z.strictObject({ id: z.string(), ref: z.string() }), indexes: {} });
const codec = { ...backupCodec(repo),
  recordId: (data: unknown) => repo.schema.parse(data).id,
  attachmentRefs: (data: unknown) => [repo.schema.parse(data).ref] };

describe('public import privacy-preserving deduplication', () => {
  it('rejects a matching private destination object without lowering its privacy', async () => {
    const source = await vaultFromStorage(createMemoryStorage(), [codec]).create(password);
    try {
      const sourceBytes = Uint8Array.of(9, 6, 3);
      const saved = await source.storage.transaction(async tx => {
        const blob = await tx.blobs.put({ tenant: source.principal, bytes: sourceBytes,
          contentType: 'image/png', privacy: 'P0', encrypted: false, now });
        if (!blob.ok) return blob;
        return tx.records.put({ tenant: source.principal, type: repo.type,
          id: 'a', data: { id: 'a', ref: blob.value.ref },
          idx: [null, null, null, null], expectedRevision: 0, now });
      });
      expect(saved.ok).toBe(true);
      const backup = await source.exportBackup(password);
      const sealed = await source.exportAttachmentManifest(password);
      const manifest = await verifySealedAttachmentManifest(sealed, password, source.principal);
      const bytes = (await readVerifiedBlobBatch(source.storage, source.principal,
        manifest.blobs.map(b => b.ref))).map(b => new Uint8Array(b.bytes));
      const dest = await vaultFromStorage(createMemoryStorage(), [codec]).restoreBackup(backup, password);
      try {
        const seeded = await dest.storage.transaction(tx => tx.blobs.put({
          tenant: dest.principal, bytes: sourceBytes,
          contentType: 'image/png', privacy: 'P1', encrypted: false, now,
        }));
        expect(seeded.ok).toBe(true);
        await expect(dest.importPublicAttachmentBatch(sealed, password, bytes))
          .rejects.toThrow(/blob metadata conflict/);
        const after = await dest.storage.read(tx =>
          tx.blobs.get(dest.principal, manifest.blobs[0]!.ref));
        expect(after?.privacy).toBe('P1');
        expect(after?.holders).toBe(0);
        expect(after?.bytes).toEqual(sourceBytes);
      } finally { await dest.lock(); }
    } finally { await source.lock(); }
  }, 30000);
});
