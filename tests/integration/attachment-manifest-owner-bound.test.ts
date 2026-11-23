import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createMemoryStorage, defineRepo, z } from '../../packages/kernel/src/index.ts';
import { unseal } from '../../packages/identity/src/index.ts';
import { verifyEnvelope } from '../../packages/federation/src/index.ts';
import { backupCodec, openVault, vaultFromStorage } from '../../packages/vault/src/vault.ts';

const passphrase = 'authenticated attachment manifest test passphrase';
const note = defineRepo({
  type: 'test.owned_attachment',
  schema: z.strictObject({ id: z.string(), ref: z.string() }),
  indexes: {},
});
const owned = {
  ...backupCodec(note),
  recordId: (input: unknown) => note.schema.parse(input).id,
  attachmentRefs: (input: unknown) => [note.schema.parse(input).ref],
};
const now = Date.parse('2026-11-23T00:00:00.000Z');

async function populate(session: Awaited<ReturnType<ReturnType<typeof vaultFromStorage>['create']>>) {
  const written = await session.storage.transaction(async tx => {
    const added = await tx.blobs.put({ tenant: session.principal,
      bytes: Uint8Array.of(8, 13, 21), contentType: 'image/png', privacy: 'P0',
      encrypted: false, now });
    if (!added.ok) return added;
    // Holder strings are not used to authorize this manifest.
    tx.blobs.attach(session.principal, added.value.ref, 'untrusted/unrelated-holder');
    return tx.records.put({ tenant: session.principal, type: note.type, id: 'image-1',
      data: { id: 'image-1', ref: added.value.ref }, idx: [null, null, null, null],
      expectedRevision: 0, now });
  });
  expect(written.ok).toBe(true);
}
async function inspect(input: unknown, password: string) {
  const bytes = await unseal(input, password);
  try {
    return await verifyEnvelope(JSON.parse(new TextDecoder().decode(bytes)), {
      expectedType: 'classrup.vault.attachment_manifest/v1',
    });
  } finally { bytes.fill(0); }
}

describe('separately signed owner-authorized attachment metadata', () => {
  it('signs canonical parent and verified blob metadata without changing legacy v1 or exporting bytes', async () => {
    const vault = vaultFromStorage(createMemoryStorage(), [owned]);
    const session = await vault.create(passphrase);
    try {
      await populate(session);
      const sealed = await session.exportAttachmentManifest(passphrase);
      const verified = await inspect(sealed, passphrase);
      expect(verified.author).toBe(session.principal);
      expect(verified.payload).toMatchObject({
        principal: session.principal,
        parents: [{ type: note.type, id: 'image-1', revision: 1 }],
        blobs: [{ contentType: 'image/png', privacy: 'P0', encrypted: false, size: 3 }],
      });
      expect((verified.payload as any).parents[0].dataCid).toMatch(/^sha256-[0-9a-f]{64}$/);
      expect((verified.payload as any).parents[0].refs).toEqual([(verified.payload as any).blobs[0].ref]);
      expect(JSON.stringify(verified)).not.toContain('untrusted/unrelated-holder');
      expect(JSON.stringify(verified)).not.toContain('8,13,21');
      expect(JSON.stringify(sealed)).not.toContain('image-1');
      await expect(session.exportAttachmentManifest('invalid passphrase')).rejects.toThrow();
      const legacy = await session.exportBackup(passphrase);
      expect((await inspectLegacy(legacy)).type).toBe('classrup.vault.alpha_backup/v1');
    } finally { await session.lock(); }
  }, 30000);

  it('retains an authenticated manifest across encrypted IndexedDB reopen', async () => {
    const indexedDB = new IDBFactory();
    const open = () => openVault({ name: 'attachment-manifest-owner', indexedDB, codecs: [owned] });
    const first = await open();
    const session = await first.create(passphrase);
    const principal = session.principal;
    await populate(session);
    await session.lock();
    const reopened = await open();
    const unlocked = await reopened.unlock(passphrase);
    try {
      const verified = await inspect(await unlocked.exportAttachmentManifest(passphrase), passphrase);
      expect(verified.author).toBe(principal);
      expect((verified.payload as any).parents).toHaveLength(1);
    } finally { await unlocked.lock(); }
  }, 30000);

  it('rejects missing referenced bytes and canonical owner-key mismatches', async () => {
    const vault = vaultFromStorage(createMemoryStorage(), [owned]);
    const session = await vault.create(passphrase);
    try {
      const missing = await session.storage.transaction(tx => tx.records.put({
        tenant: session.principal, type: note.type, id: 'wrong-storage-key',
        data: { id: 'actual-key', ref: 'blob:sha256-' + 'A'.repeat(43) },
        idx: [null, null, null, null], expectedRevision: 0, now,
      }));
      expect(missing.ok).toBe(true);
      await expect(session.exportAttachmentManifest(passphrase)).rejects.toThrow(/key mismatch/);
      const changed = await session.storage.transaction(tx => tx.records.put({
        tenant: session.principal, type: note.type, id: 'wrong-storage-key',
        data: { id: 'wrong-storage-key', ref: 'blob:sha256-' + 'A'.repeat(43) },
        idx: [null, null, null, null], expectedRevision: 1, now: now + 1000,
      }));
      expect(changed.ok).toBe(true);
      await expect(session.exportAttachmentManifest(passphrase)).rejects.toThrow(/missing bytes/);
    } finally { await session.lock(); }
  }, 30000);
});
async function inspectLegacy(input: unknown) {
  const bytes = await unseal(input, passphrase);
  try { return await verifyEnvelope(JSON.parse(new TextDecoder().decode(bytes)),
    { expectedType: 'classrup.vault.alpha_backup/v1' }); }
  finally { bytes.fill(0); }
}
