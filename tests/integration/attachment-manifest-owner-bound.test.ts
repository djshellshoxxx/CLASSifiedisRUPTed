import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createMemoryStorage, defineRepo, z } from '../../packages/kernel/src/index.ts';
import { unseal } from '../../packages/identity/src/index.ts';
import { verifyEnvelope } from '../../packages/federation/src/index.ts';
import { backupCodec, openVault, vaultFromStorage } from '../../packages/vault/src/vault.ts';
import { verifySealedAttachmentManifest } from '../../packages/vault/src/attachment-manifest.ts';

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
      // Exercise the actual signed-and-sealed producer through the receiver,
      // not only a synthetic fixture or the lower-level federation verifier.
      const receiver = await verifySealedAttachmentManifest(sealed, passphrase, session.principal);
      expect(receiver).toMatchObject({ principal: session.principal, links: 1, totalBytes: 3 });
      expect(receiver.parents[0]?.id).toBe('image-1');
      expect(receiver.blobs[0]?.ref).toBe((verified.payload as any).blobs[0].ref);
      await expect(verifySealedAttachmentManifest(sealed, passphrase, 'wrong-principal')).rejects.toThrow();
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
      await expect(verifySealedAttachmentManifest(legacy, passphrase, session.principal)).rejects.toThrow();
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
      const reopenedSealed = await unlocked.exportAttachmentManifest(passphrase);
      const verified = await inspect(reopenedSealed, passphrase);
      const receiver = await verifySealedAttachmentManifest(reopenedSealed, passphrase, principal);
      expect(receiver.parents).toHaveLength(1);
      expect(receiver.blobs).toHaveLength(1);
      expect(verified.author).toBe(principal);
      expect((verified.payload as any).parents).toHaveLength(1);
    } finally { await unlocked.lock(); }
  }, 30000);


  it('reconciles signed attachment parents after ordinary v1 record restore without requiring blob bytes', async () => {
    const origin = vaultFromStorage(createMemoryStorage(), [owned]);
    const source = await origin.create(passphrase);
    try {
      await populate(source);
      const backup = await source.exportBackup(passphrase);
      const manifest = await source.exportAttachmentManifest(passphrase);
      const destination = vaultFromStorage(createMemoryStorage(), [owned]);
      const recovered = await destination.restoreBackup(backup, passphrase);
      try {
        const bound = await recovered.verifyAttachmentManifestOwners(manifest, passphrase);
        expect(bound).toMatchObject({ principal: recovered.principal, links: 1, totalBytes: 3 });
        expect(bound.parents[0]?.id).toBe('image-1');
        // v1 restores canonical parent data, not attachment byte storage.
        const missing = await recovered.storage.read(tx => tx.blobs.get(recovered.principal, bound.blobs[0]!.ref));
        expect(missing).toBeUndefined();
        await expect(recovered.verifyAttachmentManifestOwners(manifest, 'wrong-passphrase')).rejects.toThrow();
        const changed = await recovered.storage.transaction(tx => tx.records.put({
          tenant: recovered.principal, type: note.type, id: 'image-1',
          data: { id: 'image-1', ref: bound.blobs[0]!.ref },
          idx: [null, null, null, null], expectedRevision: 1, now: now + 1000,
        }));
        expect(changed.ok).toBe(true);
        await expect(recovered.verifyAttachmentManifestOwners(manifest, passphrase)).rejects.toThrow(/mismatch/);
      } finally { await recovered.lock(); }
    } finally { await source.lock(); }
  }, 30000);


  it('rejects added and removed destination attachment owners without changing stored records', async () => {
    const source = await vaultFromStorage(createMemoryStorage(), [owned]).create(passphrase);
    try {
      await populate(source);
      const backup = await source.exportBackup(passphrase);
      const manifest = await source.exportAttachmentManifest(passphrase);
      const recovered = await vaultFromStorage(createMemoryStorage(), [owned]).restoreBackup(backup, passphrase);
      try {
        const verified = await recovered.verifyAttachmentManifestOwners(manifest, passphrase);
        const extra = await recovered.storage.transaction(tx => tx.records.put({
          tenant: recovered.principal, type: note.type, id: 'image-extra',
          data: { id: 'image-extra', ref: verified.blobs[0]!.ref },
          idx: [null, null, null, null], expectedRevision: 0, now: now + 1000,
        }));
        expect(extra.ok).toBe(true);
        await expect(recovered.verifyAttachmentManifestOwners(manifest, passphrase))
          .rejects.toThrow(/scope mismatch/);
        expect(await recovered.storage.read(tx =>
          tx.records.get(recovered.principal, note.type, 'image-extra'))).toBeDefined();

        const removeExtra = await recovered.storage.transaction(tx =>
          tx.records.remove(recovered.principal, note.type, 'image-extra', 1));
        expect(removeExtra.ok).toBe(true);
        expect((await recovered.verifyAttachmentManifestOwners(manifest, passphrase)).parents)
          .toHaveLength(1);

        const removeOwner = await recovered.storage.transaction(tx =>
          tx.records.remove(recovered.principal, note.type, 'image-1', 1));
        expect(removeOwner.ok).toBe(true);
        await expect(recovered.verifyAttachmentManifestOwners(manifest, passphrase))
          .rejects.toThrow(/scope mismatch/);
      } finally { await recovered.lock(); }
    } finally { await source.lock(); }
  }, 30000);

  it('rejects unsupported destination record types despite an otherwise matching signed manifest', async () => {
    const source = await vaultFromStorage(createMemoryStorage(), [owned]).create(passphrase);
    try {
      await populate(source);
      const backup = await source.exportBackup(passphrase);
      const manifest = await source.exportAttachmentManifest(passphrase);
      const recovered = await vaultFromStorage(createMemoryStorage(), [owned]).restoreBackup(backup, passphrase);
      try {
        const extra = await recovered.storage.transaction(tx => tx.records.put({
          tenant: recovered.principal, type: 'test.unsupported_record', id: 'unexpected',
          data: { name: 'unexpected' }, idx: [null, null, null, null],
          expectedRevision: 0, now: now + 1000,
        }));
        expect(extra.ok).toBe(true);
        await expect(recovered.verifyAttachmentManifestOwners(manifest, passphrase))
          .rejects.toThrow(/complete supported record coverage/);
        expect(await recovered.storage.read(tx =>
          tx.records.get(recovered.principal, 'test.unsupported_record', 'unexpected')))
          .toBeDefined();
      } finally { await recovered.lock(); }
    } finally { await source.lock(); }
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
