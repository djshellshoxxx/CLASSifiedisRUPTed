import { expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { defineRepo, z } from '../../packages/kernel/src/index.ts';
import { backupCodec, openVault } from '../../packages/vault/src/vault.ts';

// Holder rows can outlive the bytes they mention. These labels do not prove
// owner authority, and v1 is a records-only archive.
const note = defineRepo({
  type: 'test.missingattachment',
  schema: z.strictObject({ text: z.string() }),
  indexes: {},
});
const passphrase = 'missing attachment diagnostic regression passphrase';
const now = Date.parse('2026-11-22T12:00:00.000Z');

it('retains a missing-blob warning after encrypted reopen without inventing attachment recovery', async () => {
  const indexedDB = new IDBFactory();
  const open = (name: string) => openVault({
    name, indexedDB, codecs: [backupCodec(note)],
  });
  const sourceVault = await open('missing-ref-source');
  const source = await sourceVault.create(passphrase);
  const principal = source.principal;

  const recordWrite = await source.storage.transaction(tx => tx.records.put({
    tenant: principal, type: note.type, id: 'record-1',
    data: { text: 'owner-only record' }, idx: [null, null, null, null],
    expectedRevision: 0, now,
  }));
  expect(recordWrite.ok).toBe(true);

  // A syntactically valid content address can have a holder but no local blob.
  const missingRef = 'blob:sha256-' + 'A'.repeat(43);
  const holderWrite = await source.storage.transaction(tx =>
    tx.blobs.attach(principal, missingRef, 'test/unverified-holder'));
  expect(holderWrite).toMatchObject({
    ok: true, value: { holders: 1, present: false },
  });
  expect(await source.storage.read(tx => tx.blobs.get(principal, missingRef)))
    .toBeUndefined();

  const first = await source.backupInspection!();
  expect(first.records.recordCount).toBe(1);
  expect(first.attachments).toMatchObject({
    referencedBlobs: 1, missingBlobs: 1, excludedStoredReferences: 0,
    holderRows: 1, limitExceeded: false, holderAuthorityVerified: false,
    includedInV1Backup: false,
  });
  expect(JSON.stringify(first)).not.toContain(missingRef);
  expect(JSON.stringify(first)).not.toContain('unverified-holder');
  expect(JSON.stringify(first)).not.toContain('owner-only record');
  await source.lock();

  // Persistence of the warning is distinct from portability of the bytes.
  const sourceReopen = await open('missing-ref-source');
  const sourceSession = await sourceReopen.unlock(passphrase);
  expect(sourceSession.principal).toBe(principal);
  expect((await sourceSession.backupInspection!()).attachments).toMatchObject({
    referencedBlobs: 1, missingBlobs: 1, excludedStoredReferences: 0,
    holderRows: 1, includedInV1Backup: false,
  });
  const backup = await sourceSession.exportBackup(passphrase);
  expect(backup.format).toBe('classrup.sealed/v1');
  await sourceSession.lock();

  const targetVault = await open('missing-ref-target');
  const target = await targetVault.restoreBackup(backup, passphrase);
  expect(target.principal).toBe(principal);
  expect((await target.storage.read(tx =>
    tx.records.get(principal, note.type, 'record-1')))?.data)
    .toEqual({ text: 'owner-only record' });
  expect((await target.backupInspection!()).attachments).toMatchObject({
    referencedBlobs: 0, missingBlobs: 0, excludedStoredReferences: 0,
    holderRows: 0, holderAuthorityVerified: false, includedInV1Backup: false,
  });
  await target.lock();

  // A second open verifies the destination persisted only its permitted v1 scope.
  const targetReopen = await open('missing-ref-target');
  const targetSession = await targetReopen.unlock(passphrase);
  expect(targetSession.principal).toBe(principal);
  expect((await targetSession.storage.read(tx =>
    tx.records.get(principal, note.type, 'record-1')))?.data)
    .toEqual({ text: 'owner-only record' });
  const targetPreview = await targetSession.backupInspection!();
  expect(targetPreview.records.recordCount).toBe(1);
  expect(targetPreview.attachments).toMatchObject({
    referencedBlobs: 0, missingBlobs: 0, excludedStoredReferences: 0,
    holderRows: 0, includedInV1Backup: false,
  });
  await targetSession.lock();
}, 30_000);
