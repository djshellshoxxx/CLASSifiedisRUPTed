import { describe, expect, it } from 'vitest';
import { createMemoryStorage, defineRepo, readVerifiedBlobBatch, z } from '../../packages/kernel/src/index.ts';
import { backupCodec, vaultFromStorage } from '../../packages/vault/src/vault.ts';
import { verifySealedAttachmentManifest } from '../../packages/vault/src/attachment-manifest.ts';

const passphrase = 'two-blob-import-transaction-rollback';
const now = Date.parse('2026-11-23T00:00:00.000Z');
const repo = defineRepo({ type: 'test.public_import_rollback',
  schema: z.strictObject({ id: z.string(), ref: z.string() }), indexes: {} });
const codec = { ...backupCodec(repo),
  recordId: (data: unknown) => repo.schema.parse(data).id,
  attachmentRefs: (data: unknown) => [repo.schema.parse(data).ref] };

describe('atomic public import rollback', () => {
  it('does not retain the first inserted blob when a later blob conflicts', async () => {
    const source = await vaultFromStorage(createMemoryStorage(), [codec]).create(passphrase);
    try {
      for (const [id, bytes] of [['a', Uint8Array.of(1, 2, 3)],
        ['b', Uint8Array.of(4, 5, 6, 7)]] as const) {
        const result = await source.storage.transaction(async tx => {
          const blob = await tx.blobs.put({ tenant: source.principal, bytes,
            contentType: 'image/png', privacy: 'P0', encrypted: false, now });
          if (!blob.ok) return blob;
          return tx.records.put({ tenant: source.principal, type: repo.type, id,
            data: { id, ref: blob.value.ref }, idx: [null, null, null, null],
            expectedRevision: 0, now });
        });
        expect(result.ok).toBe(true);
      }
      const archive = await source.exportBackup(passphrase);
      const sealed = await source.exportAttachmentManifest(passphrase);
      const manifest = await verifySealedAttachmentManifest(sealed, passphrase, source.principal);
      const bytes = (await readVerifiedBlobBatch(source.storage, source.principal,
        manifest.blobs.map(row => row.ref))).map(row => new Uint8Array(row.bytes));
      const dest = await vaultFromStorage(createMemoryStorage(), [codec])
        .restoreBackup(archive, passphrase);
      try {
        const seeded = await dest.storage.transaction(tx => tx.blobs.put({
          tenant: dest.principal, bytes: bytes[1]!, contentType: 'image/png',
          privacy: 'P1', encrypted: false, now,
        }));
        expect(seeded.ok).toBe(true);
        await expect(dest.importPublicAttachmentBatch(sealed, passphrase, bytes))
          .rejects.toThrow(/blob metadata conflict/);
        expect(await dest.storage.read(tx =>
          tx.blobs.get(dest.principal, manifest.blobs[0]!.ref))).toBeUndefined();
        const second = await dest.storage.read(tx =>
          tx.blobs.get(dest.principal, manifest.blobs[1]!.ref));
        expect(second?.privacy).toBe('P1');
        expect(second?.holders).toBe(0);
      } finally { await dest.lock(); }
    } finally { await source.lock(); }
  }, 30000);
});
