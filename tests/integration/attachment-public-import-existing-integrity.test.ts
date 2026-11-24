import { describe, expect, it } from 'vitest';
import { createMemoryDriver, createMemoryStorage, createStorage, defineRepo, readVerifiedBlobBatch, z } from '../../packages/kernel/src/index.ts';
import { backupCodec, vaultFromStorage } from '../../packages/vault/src/vault.ts';
import { verifySealedAttachmentManifest } from '../../packages/vault/src/attachment-manifest.ts';

const password = 'public-import-existing-content-integrity';
const now = Date.parse('2026-11-23T00:00:00.000Z');
const repo = defineRepo({ type: 'test.public_import_existing_integrity',
  schema: z.strictObject({ id: z.string(), ref: z.string() }), indexes: {} });
const codec = { ...backupCodec(repo),
  recordId: (data: unknown) => repo.schema.parse(data).id,
  attachmentRefs: (data: unknown) => [repo.schema.parse(data).ref] };

async function fixture() {
  const source = await vaultFromStorage(createMemoryStorage(), [codec]).create(password);
  const original = Uint8Array.of(7, 8, 9);
  const saved = await source.storage.transaction(async tx => {
    const blob = await tx.blobs.put({ tenant: source.principal, bytes: original,
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
  const expected = manifest.blobs[0]!;
  const bytes = (await readVerifiedBlobBatch(source.storage, source.principal, [expected.ref]))
    .map(row => new Uint8Array(row.bytes));
  return { source, original, backup, sealed, expected, bytes };
}

describe('public attachment import existing-row integrity', () => {
  it('rejects an existing matching-metadata blob with corrupt bytes without attaching it', async () => {
    const { source, backup, sealed, expected, bytes } = await fixture();
    try {
      // Construct a damaged persisted driver snapshot. Normal content-addressed
      // APIs refuse to manufacture this state, so corrupt storage is injected at
      // the driver boundary rather than by weakening production admission.
      const corrupt = Uint8Array.of(7, 8, 10);
      const seeded = createStorage(createMemoryDriver({ snapshot: {
        blobs: [[source.principal + '\u0001' + expected.ref, {
          tenant: source.principal, ref: expected.ref, bytes: corrupt,
          size: expected.size, contentType: expected.contentType,
          privacy: 'P0', encrypted: false, createdAt: expected.createdAt,
        }]],
      } }));
      const dest = await vaultFromStorage(seeded, [codec]).restoreBackup(backup, password);
      try {
        await expect(dest.importPublicAttachmentBatch(sealed, password, bytes))
          .rejects.toThrow(/existing blob content conflict/);
        const after = await dest.storage.read(tx => tx.blobs.get(dest.principal, expected.ref));
        expect(after?.bytes).toEqual(corrupt);
        expect(after?.holders).toBe(0);
      } finally { await dest.lock(); }
    } finally { await source.lock(); }
  }, 30000);

  it('accepts identical existing P0 bytes and keeps repeat imports idempotent', async () => {
    const { source, backup, sealed, expected, bytes, original } = await fixture();
    try {
      const dest = await vaultFromStorage(createMemoryStorage(), [codec]).restoreBackup(backup, password);
      try {
        const seeded = await dest.storage.transaction(tx => tx.blobs.put({
          tenant: dest.principal, bytes: new Uint8Array(original),
          contentType: expected.contentType, privacy: 'P0', encrypted: false, now,
        }));
        expect(seeded.ok).toBe(true);
        await dest.importPublicAttachmentBatch(sealed, password, bytes);
        await dest.importPublicAttachmentBatch(sealed, password, bytes);
        const after = await dest.storage.read(tx => tx.blobs.get(dest.principal, expected.ref));
        expect(after?.bytes).toEqual(original);
        expect(after?.holders).toBe(1);
      } finally { await dest.lock(); }
    } finally { await source.lock(); }
  }, 30000);
});
