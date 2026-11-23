import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createMemoryStorage, defineRepo, readVerifiedBlobBatch, z } from '../../packages/kernel/src/index.ts';
import { backupCodec, openVault, vaultFromStorage } from '../../packages/vault/src/vault.ts';
import { verifySealedAttachmentManifest } from '../../packages/vault/src/attachment-manifest.ts';

const password = 'public-import-indexeddb-encrypted-reopen';
const now = Date.parse('2026-11-23T00:00:00.000Z');
const repo = defineRepo({ type: 'test.public_import_reopen',
  schema: z.strictObject({ id: z.string(), ref: z.string() }), indexes: {} });
const codec = { ...backupCodec(repo),
  recordId: (data: unknown) => repo.schema.parse(data).id,
  attachmentRefs: (data: unknown) => [repo.schema.parse(data).ref] };

describe('public attachment import encrypted reopen', () => {
  it('persists destination-owned public bytes through a fresh IndexedDB unlock', async () => {
    const source = await vaultFromStorage(createMemoryStorage(), [codec]).create(password);
    try {
      const blob = await source.storage.transaction(tx => tx.blobs.put({
        tenant: source.principal, bytes: Uint8Array.of(11, 22, 33),
        contentType: 'image/png', privacy: 'P0', encrypted: false, now }));
      expect(blob.ok).toBe(true);
      if (!blob.ok) return;
      const record = await source.storage.transaction(tx => tx.records.put({
        tenant: source.principal, type: repo.type, id: 'pic',
        data: { id: 'pic', ref: blob.value.ref }, idx: [null, null, null, null],
        expectedRevision: 0, now }));
      expect(record.ok).toBe(true);
      const backup = await source.exportBackup(password);
      const sealed = await source.exportAttachmentManifest(password);
      const manifest = await verifySealedAttachmentManifest(sealed, password, source.principal);
      const bytes = (await readVerifiedBlobBatch(source.storage, source.principal,
        manifest.blobs.map(item => item.ref))).map(item => new Uint8Array(item.bytes));
      const indexedDB = new IDBFactory();
      const open = () => openVault({ name: 'public-attachment-reopen', indexedDB, codecs: [codec] });
      const first = await open();
      const imported = await first.restoreBackup(backup, password);
      await imported.importPublicAttachmentBatch(sealed, password, bytes);
      await imported.lock();
      const reopened = await open();
      const session = await reopened.unlock(password);
      try {
        expect(session.principal).toBe(source.principal);
        const persisted = await session.storage.read(tx =>
          tx.blobs.get(session.principal, manifest.blobs[0]!.ref));
        expect(persisted?.bytes).toEqual(Uint8Array.of(11, 22, 33));
        expect(persisted?.holders).toBe(1);
      } finally { await session.lock(); }
    } finally { await source.lock(); }
  }, 30000);
});
