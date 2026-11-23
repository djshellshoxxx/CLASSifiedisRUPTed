import { describe, expect, it } from 'vitest';
import { createMemoryStorage, defineRepo, readVerifiedBlobBatch, z } from '../../packages/kernel/src/index.ts';
import { backupCodec, vaultFromStorage } from '../../packages/vault/src/vault.ts';
import { verifySealedAttachmentManifest } from '../../packages/vault/src/attachment-manifest.ts';

const password = 'public-attachment-acceptance-passphrase';
const date = Date.parse('2026-11-23T00:00:00.000Z');
const repo = defineRepo({ type: 'test.public_attachment_import',
  schema: z.strictObject({ id: z.string(), ref: z.string() }), indexes: {} });
const codec = { ...backupCodec(repo),
  recordId: (data: unknown) => repo.schema.parse(data).id,
  attachmentRefs: (data: unknown) => [repo.schema.parse(data).ref] };

describe('public attachment import', () => {
  it('restores canonical public bytes with authenticated owner references', async () => {
    const source = await vaultFromStorage(createMemoryStorage(), [codec]).create(password);
    try {
      const stored = await source.storage.transaction(async tx => {
        const b = await tx.blobs.put({ tenant: source.principal, bytes: Uint8Array.of(1, 2, 3),
          contentType: 'image/png', privacy: 'P0', encrypted: false, now: date });
        if (!b.ok) return b;
        return tx.records.put({ tenant: source.principal, type: repo.type, id: 'a',
          data: { id: 'a', ref: b.value.ref }, idx: [null, null, null, null],
          expectedRevision: 0, now: date });
      });
      expect(stored.ok).toBe(true);
      const archive = await source.exportBackup(password);
      const sealed = await source.exportAttachmentManifest(password);
      const manifest = await verifySealedAttachmentManifest(sealed, password, source.principal);
      const bytes = (await readVerifiedBlobBatch(source.storage, source.principal,
        manifest.blobs.map(blob => blob.ref))).map(blob => new Uint8Array(blob.bytes));
      const dest = await vaultFromStorage(createMemoryStorage(), [codec]).restoreBackup(archive, password);
      try {
        expect((await dest.importPublicAttachmentBatch(sealed, password, bytes)).blobs).toHaveLength(1);
        const actual = await dest.storage.read(tx => tx.blobs.get(dest.principal, manifest.blobs[0]!.ref));
        expect(actual?.bytes).toEqual(Uint8Array.of(1, 2, 3));
        expect(actual?.holders).toBe(1);
      } finally { await dest.lock(); }
    } finally { await source.lock(); }
  }, 30000);

  it('keeps one shared blob with two canonical owner holders across repeat import', async () => {
    const source = await vaultFromStorage(createMemoryStorage(), [codec]).create(password);
    try {
      const stored = await source.storage.transaction(async tx => {
        const b = await tx.blobs.put({ tenant: source.principal, bytes: Uint8Array.of(4, 5, 6),
          contentType: 'image/png', privacy: 'P0', encrypted: false, now: date });
        if (!b.ok) return b;
        const a = tx.records.put({ tenant: source.principal, type: repo.type, id: 'a',
          data: { id: 'a', ref: b.value.ref }, idx: [null, null, null, null],
          expectedRevision: 0, now: date });
        if (!a.ok) return a;
        return tx.records.put({ tenant: source.principal, type: repo.type, id: 'b',
          data: { id: 'b', ref: b.value.ref }, idx: [null, null, null, null],
          expectedRevision: 0, now: date });
      });
      expect(stored.ok).toBe(true);
      const archive = await source.exportBackup(password);
      const sealed = await source.exportAttachmentManifest(password);
      const manifest = await verifySealedAttachmentManifest(sealed, password, source.principal);
      expect(manifest.parents.map(parent => parent.id)).toEqual(['a', 'b']);
      expect(manifest.links).toBe(2);
      expect(manifest.blobs).toHaveLength(1);
      const ref = manifest.blobs[0]!.ref;
      const bytes = (await readVerifiedBlobBatch(source.storage, source.principal, [ref]))
        .map(blob => new Uint8Array(blob.bytes));
      const dest = await vaultFromStorage(createMemoryStorage(), [codec]).restoreBackup(archive, password);
      try {
        await dest.importPublicAttachmentBatch(sealed, password, bytes);
        await dest.importPublicAttachmentBatch(sealed, password, bytes);
        const actual = await dest.storage.read(tx => tx.blobs.get(dest.principal, ref));
        expect(actual?.bytes).toEqual(Uint8Array.of(4, 5, 6));
        expect(actual?.holders).toBe(2);
      } finally { await dest.lock(); }
    } finally { await source.lock(); }
  }, 30000);
});
