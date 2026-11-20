import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { z } from '../../packages/kernel/src/index.ts';
import { archiveRecordRepo, RESTORE_WINDOW_MS } from '../../packages/bazaar/src/index.ts';
import { openVault, type BackupCodec } from '../../packages/vault/src/index.ts';
import { archiveBackupCodec } from '../../apps/pwa/src/archive-backup.ts';
import { productionBackupCodecs } from '../../apps/pwa/src/backup-codecs.ts';

const passphrase = 'cross-version encrypted vault downgrade compatibility';
const archiveId = '0195aaaa-0000-7000-8000-000000000031';
const futureId = 'future-private-row-one';
const signedMessage = new TextEncoder().encode('downgrade export must not lose future records');

const futureSchema = z.strictObject({ ownerId: z.string(), body: z.string() });
const futureCodec: BackupCodec = {
  type: 'test.future_private_record',
  parse: input => futureSchema.parse(input),
  indexes(input) {
    const data = futureSchema.parse(input);
    return [data.ownerId, null, null, null];
  },
};

describe('downgraded production registry preserves newer encrypted records', () => {
  it('blocks a lossy old-app export, then allows unchanged future-app reopening and export', async () => {
    const indexedDB = new IDBFactory();
    const futureRegistry = [...productionBackupCodecs, futureCodec];
    expect(productionBackupCodecs.some(codec => codec.type === futureCodec.type)).toBe(false);

    const modern = await openVault({
      name: 'downgrade-export-same-vault', indexedDB, codecs: futureRegistry,
    });
    const initial = await modern.create(passphrase);
    const principal = initial.principal;
    const originalSignature = await initial.identity.sign(signedMessage);
    const archivedAt = new Date().toISOString();
    const restoreUntil = new Date(Date.parse(archivedAt) + RESTORE_WINDOW_MS).toISOString();
    const archive = {
      listingId: archiveId, ownerId: principal, status: 'archived' as const,
      endedAt: archivedAt, archivedAt, restoreUntil, purgeAt: restoreUntil,
    };
    const future = { ownerId: principal, body: 'A private row the older application cannot export' };
    try {
      const saved = await initial.storage.transaction(tx => {
        const known = tx.records.put({
          tenant: principal, type: archiveRecordRepo.type, id: archiveId,
          data: archive, idx: archiveBackupCodec.indexes(archive),
          expectedRevision: 0, now: Date.now(),
        });
        if (!known.ok) return known;
        return tx.records.put({
          tenant: principal, type: futureCodec.type, id: futureId,
          data: future, idx: futureCodec.indexes(future),
          expectedRevision: 0, now: Date.now(),
        });
      });
      expect(saved.ok).toBe(true);
      expect((await initial.backupCoverage()).unsupportedRecordTypes).toEqual([]);
    } finally {
      await initial.lock();
    }

    // Opening a newer on-disk vault with an older, production-only codec set is
    // permitted, but that registry must never export an incomplete recovery kit.
    const older = await openVault({
      name: 'downgrade-export-same-vault', indexedDB, codecs: productionBackupCodecs,
    });
    const downgraded = await older.unlock(passphrase);
    try {
      expect(downgraded.principal).toBe(principal);
      expect(await downgraded.identity.sign(signedMessage)).toEqual(originalSignature);
      const coverage = await downgraded.backupCoverage();
      expect(coverage.recordTypes).toEqual([
        { type: archiveRecordRepo.type, count: 1 },
        { type: futureCodec.type, count: 1 },
      ]);
      expect(coverage.unsupportedRecordTypes).toEqual([futureCodec.type]);
      expect(coverage.recordCount).toBe(2);
      await expect(downgraded.exportBackup(passphrase))
        .rejects.toThrow('Backup contains unsupported record types');
      expect((await downgraded.storage.read(tx =>
        tx.records.get(principal, archiveRecordRepo.type, archiveId)))?.data).toEqual(archive);
      expect((await downgraded.storage.read(tx =>
        tx.records.get(principal, futureCodec.type, futureId)))?.data).toEqual(future);
    } finally {
      await downgraded.lock();
    }

    // The failed old-app export cannot delete the unknown row or mutate signing identity.
    const reopened = await openVault({
      name: 'downgrade-export-same-vault', indexedDB, codecs: futureRegistry,
    });
    const upgraded = await reopened.unlock(passphrase);
    try {
      expect(upgraded.principal).toBe(principal);
      expect(await upgraded.identity.sign(signedMessage)).toEqual(originalSignature);
      expect((await upgraded.backupCoverage()).unsupportedRecordTypes).toEqual([]);
      expect((await upgraded.storage.read(tx =>
        tx.records.get(principal, archiveRecordRepo.type, archiveId)))?.data).toEqual(archive);
      expect((await upgraded.storage.read(tx =>
        tx.records.get(principal, futureCodec.type, futureId)))?.data).toEqual(future);
      const backup = await upgraded.exportBackup(passphrase);
      expect(backup.format).toBe('classrup.sealed/v1');
    } finally {
      await upgraded.lock();
    }
  }, 30000);
});
