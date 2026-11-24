import { describe, expect, it, vi } from 'vitest';
import { blobRefOf, createMemoryStorage, defineRepo, type Storage, z } from '../../packages/kernel/src/index.ts';
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
  it.each(['missing bytes', 'read finalization failed'] as const)(
    'wipes temporary attachment bytes on %s and preserves stored bytes', async failure => {
      const memory = createMemoryStorage();
      let failAfterCallback = false;
      const storage: Storage = { ...memory, async read(fn) {
        const result = await memory.read(fn);
        if (failAfterCallback) {
          failAfterCallback = false;
          throw new Error('read finalization failed');
        }
        return result;
      } };
      const session = await vaultFromStorage(storage, [codec]).create(passphrase);
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
        if (failure === 'missing bytes') {
          const missingRef = await blobRefOf(Uint8Array.of(55, 66, 77, 88));
          const missing = await session.storage.transaction(tx => tx.records.put({
            tenant: session.principal, type: note.type, id: 'z-missing',
            data: { id: 'z-missing', ref: missingRef },
            idx: [null, null, null, null], expectedRevision: 0, now,
          }));
          expect(missing.ok).toBe(true);
        } else {
          failAfterCallback = true;
        }

        const cleared: Uint8Array[] = [];
        const fill = Uint8Array.prototype.fill;
        const wipe = vi.spyOn(Uint8Array.prototype, 'fill').mockImplementation(
          function (this: Uint8Array, value, start, end) {
            if (value === 0 && this.length === sourceBytes.length
              && this.every((byte, index) => byte === sourceBytes[index])) cleared.push(this);
            return fill.call(this, value, start, end);
          },
        );
        try {
          await expect(session.exportAttachmentManifest(passphrase)).rejects.toThrow(failure);
          expect(cleared.length).toBeGreaterThan(0);
          for (const copy of cleared) expect(copy).toEqual(new Uint8Array(sourceBytes.length));
          expect((await session.storage.read(tx =>
            tx.blobs.get(session.principal, blob.value.ref)))?.bytes).toEqual(sourceBytes);
        } finally { wipe.mockRestore(); }
      } finally { await session.lock(); }
    }, 30000,
  );
});
