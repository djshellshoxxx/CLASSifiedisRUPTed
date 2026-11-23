import { describe, expect, it, vi } from 'vitest';
import { blobRefOf, createMemoryStorage, defineRepo, z } from '../../packages/kernel/src/index.ts';
import { backupCodec, vaultFromStorage } from '../../packages/vault/src/vault.ts';

const passphrase = 'attachment manifest transaction failure cleanup passphrase';
const now = Date.parse('2026-11-23T00:00:00.000Z');
const note = defineRepo({
  type: 'test.manifest_failed_snapshot_cleanup',
  schema: z.strictObject({ id: z.string(), ref: z.string() }),
  indexes: {},
});
const codec = {
  ...backupCodec(note),
  recordId: (input: unknown) => note.schema.parse(input).id,
  attachmentRefs: (input: unknown) => [note.schema.parse(input).ref],
};

describe('attachment manifest failed snapshot memory lifetime', () => {
  it('clears an earlier copied blob when a later canonical parent has missing bytes', async () => {
    const session = await vaultFromStorage(createMemoryStorage(), [codec]).create(passphrase);
    try {
      const sourceBytes = Uint8Array.of(11, 22, 33);
      const blob = await session.storage.transaction(tx => tx.blobs.put({
        tenant: session.principal, bytes: sourceBytes, contentType: 'image/png',
        privacy: 'P0', encrypted: false, now,
      }));
      expect(blob.ok).toBe(true);
      if (!blob.ok) return;
      const saved = await session.storage.transaction(tx => tx.records.put({
        tenant: session.principal, type: note.type, id: 'a-present',
        data: { id: 'a-present', ref: blob.value.ref },
        idx: [null, null, null, null], expectedRevision: 0, now,
      }));
      expect(saved.ok).toBe(true);
      const missingRef = await blobRefOf(Uint8Array.of(55, 66, 77, 88));
      const missing = await session.storage.transaction(tx => tx.records.put({
        tenant: session.principal, type: note.type, id: 'z-missing',
        data: { id: 'z-missing', ref: missingRef },
        idx: [null, null, null, null], expectedRevision: 0, now,
      }));
      expect(missing.ok).toBe(true);

      const wipe = vi.spyOn(Uint8Array.prototype, 'fill');
      try {
        await expect(session.exportAttachmentManifest(passphrase))
          .rejects.toThrow(/missing bytes/);
        // Copies collected before the failure must be wiped, not merely left
        // for garbage collection. The stored source is never caller-wiped.
        const cleared = wipe.mock.instances.filter(bytes =>
          bytes instanceof Uint8Array && bytes.byteLength === sourceBytes.byteLength
          && bytes.every(value => value === 0));
        expect(cleared.length).toBeGreaterThan(0);
        expect((await session.storage.read(tx =>
          tx.blobs.get(session.principal, blob.value.ref)))?.bytes).toEqual(sourceBytes);
      } finally { wipe.mockRestore(); }
    } finally { await session.lock(); }
  }, 30000);
});
