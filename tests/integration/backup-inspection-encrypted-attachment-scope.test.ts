import { expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { defineRepo, z } from '../../packages/kernel/src/index.ts';
import { backupCodec, openVault } from '../../packages/vault/src/vault.ts';

// This verifies the *existing* v1 exclusion boundary, not portable attachment
// recovery. It uses a real encrypted IndexedDB storage wrapper and a reopen.
const note = defineRepo({
  type: 'test.attachmentreopen',
  schema: z.strictObject({ text: z.string() }),
  indexes: {},
});
const passphrase = 'encrypted attachment scope regression passphrase';
const now = Date.parse('2026-11-22T12:00:00.000Z');

it('keeps owner attachment diagnostics after encrypted reopen but excludes bytes and refs from v1 restore', async () => {
  const indexedDB = new IDBFactory();
  const codecs = [backupCodec(note)];
  const open = (name: string) => openVault({ name, indexedDB, codecs });
  const sourceVault = await open('scope-source');
  const source = await sourceVault.create(passphrase);
  const principal = source.principal;

  const stored = await source.storage.transaction(async tx => {
    const blob = await tx.blobs.put({
      tenant: principal, bytes: new Uint8Array([21, 34, 55, 89]),
      contentType: 'image/png', privacy: 'P0', encrypted: false, now,
    });
    if (!blob.ok) return blob;
    tx.blobs.attach(principal, blob.value.ref, 'test/attachment-holder');
    return tx.records.put({
      tenant: principal, type: note.type, id: 'retained-record',
      data: { text: 'private record content' },
      idx: [null, null, null, null], expectedRevision: 0, now,
    });
  });
  expect(stored.ok).toBe(true);
  const first = await source.backupInspection!();
  expect(first.records).toMatchObject({ recordCount: 1, typeLimitExceeded: false });
  expect(first.attachments).toMatchObject({
    referencedBlobs: 1, missingBlobs: 0, excludedStoredReferences: 1,
    holderRows: 1, limitExceeded: false, holderAuthorityVerified: false,
    includedInV1Backup: false,
  });
  expect(JSON.stringify(first)).not.toMatch(/private record content|attachment-holder|blob:sha256-/);
  const backup = await source.exportBackup(passphrase);
  expect(backup.format).toBe('classrup.sealed/v1');
  await source.lock();

  const reopenedVault = await open('scope-source');
  const reopened = await reopenedVault.unlock(passphrase);
  expect(reopened.principal).toBe(principal);
  const persisted = await reopened.backupInspection!();
  expect(persisted.records.recordCount).toBe(1);
  expect(persisted.attachments).toMatchObject({
    referencedBlobs: 1, missingBlobs: 0, excludedStoredReferences: 1,
    holderRows: 1, includedInV1Backup: false,
  });
  await reopened.lock();

  // A v1 restore is intentionally records-only. This assertion prevents a
  // future UI or recovery refactor from incorrectly claiming attachment parity.
  const destinationVault = await open('scope-destination');
  const restored = await destinationVault.restoreBackup(backup, passphrase);
  expect(restored.principal).toBe(principal);
  expect((await restored.storage.read(tx =>
    tx.records.get(principal, note.type, 'retained-record')))?.data
  ).toEqual({ text: 'private record content' });
  const restoredPreview = await restored.backupInspection!();
  expect(restoredPreview.records.recordCount).toBe(1);
  expect(restoredPreview.records.excludedStores).toContain('blob_refs');
  expect(restoredPreview.attachments).toMatchObject({
    referencedBlobs: 0, missingBlobs: 0, excludedStoredReferences: 0,
    holderRows: 0, limitExceeded: false, holderAuthorityVerified: false,
    includedInV1Backup: false,
  });
  await restored.lock();
}, 30_000);
