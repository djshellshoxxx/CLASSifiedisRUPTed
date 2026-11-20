import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { z } from '../../packages/kernel/src/index.ts';
import { archiveRecordRepo, RESTORE_WINDOW_MS } from '../../packages/bazaar/src/index.ts';
import { openVault, type BackupCodec } from '../../packages/vault/src/index.ts';
import { archiveBackupCodec } from '../../apps/pwa/src/archive-backup.ts';
import { productionBackupCodecs } from '../../apps/pwa/src/backup-codecs.ts';

const passphrase = 'encrypted owner-scoped backup compatibility fixture';
const archiveId = '0195aaaa-0000-7000-8000-000000000041';
const foreignId = 'other-principal-newer-record';
const foreignTenant = 'unrelated-principal';
const message = new TextEncoder().encode('foreign codec must not enter owner recovery');
const newSchema = z.strictObject({ ownerId: z.string(), body: z.string() });
const futureCodec: BackupCodec = {
  type: 'test.other_principal_future_record',
  parse: input => newSchema.parse(input),
  indexes(input) {
    const record = newSchema.parse(input);
    return [record.ownerId, null, null, null];
  },
};

describe('production backup remains principal-scoped across codec versions', () => {
  it('exports only the owner despite an unsupported foreign-tenant encrypted record', async () => {
    const indexedDB = new IDBFactory();
    const modernCodecs = [...productionBackupCodecs, futureCodec];
    expect(productionBackupCodecs.some(codec => codec.type === futureCodec.type)).toBe(false);

    const original = await openVault({
      name: 'foreign-codec-origin', indexedDB, codecs: modernCodecs,
    });
    const session = await original.create(passphrase);
    const principal = session.principal;
    const signature = await session.identity.sign(message);
    const archivedAt = new Date().toISOString();
    const restoreUntil = new Date(Date.parse(archivedAt) + RESTORE_WINDOW_MS).toISOString();
    const archive = {
      listingId: archiveId, ownerId: principal, status: 'archived' as const,
      endedAt: archivedAt, archivedAt, restoreUntil, purgeAt: restoreUntil,
    };
    const foreign = { ownerId: foreignTenant, body: 'Must never appear in owner backup' };

    try {
      const saved = await session.storage.transaction(tx => {
        const own = tx.records.put({
          tenant: principal, type: archiveRecordRepo.type, id: archiveId,
          data: archive, idx: archiveBackupCodec.indexes(archive),
          expectedRevision: 0, now: Date.now(),
        });
        if (!own.ok) return own;
        return tx.records.put({
          tenant: foreignTenant, type: futureCodec.type, id: foreignId,
          data: foreign, idx: futureCodec.indexes(foreign),
          expectedRevision: 0, now: Date.now(),
        });
      });
      expect(saved.ok).toBe(true);
    } finally {
      await session.lock();
    }

    // This older registry must neither reject because of an unrelated tenant's
    // record nor accidentally include that private record in its signed export.
    const older = await openVault({
      name: 'foreign-codec-origin', indexedDB, codecs: productionBackupCodecs,
    });
    const downgraded = await older.unlock(passphrase);
    let exported: Awaited<ReturnType<typeof downgraded.exportBackup>>;
    try {
      const coverage = await downgraded.backupCoverage();
      expect(coverage.recordTypes).toEqual([{ type: archiveRecordRepo.type, count: 1 }]);
      expect(coverage.recordCount).toBe(1);
      expect(coverage.unsupportedRecordTypes).toEqual([]);
      expect(coverage.typeLimitExceeded).toBe(false);
      expect(coverage.recordLimitExceeded).toBe(false);
      exported = await downgraded.exportBackup(passphrase);
      expect(exported.format).toBe('classrup.sealed/v1');
      expect(await downgraded.identity.sign(message)).toEqual(signature);
      expect((await downgraded.storage.read(tx =>
        tx.records.get(foreignTenant, futureCodec.type, foreignId)))?.data).toEqual(foreign);
    } finally {
      await downgraded.lock();
    }

    // The legitimate archive and signing identity must survive normal recovery,
    // but no foreign tenant row may be copied by export/restore.
    const recovered = await openVault({
      name: 'foreign-codec-restored', indexedDB, codecs: productionBackupCodecs,
    });
    const restored = await recovered.restoreBackup(exported, passphrase);
    try {
      expect(restored.principal).toBe(principal);
      expect(await restored.identity.sign(message)).toEqual(signature);
      expect((await restored.backupCoverage()).recordTypes)
        .toEqual([{ type: archiveRecordRepo.type, count: 1 }]);
      expect((await restored.storage.read(tx =>
        tx.records.get(principal, archiveRecordRepo.type, archiveId)))?.data).toEqual(archive);
      expect(await restored.storage.read(tx =>
        tx.records.get(foreignTenant, futureCodec.type, foreignId))).toBeUndefined();
    } finally {
      await restored.lock();
    }

    // The original encrypted database still contains the unrelated row:
    // export filtering did not erase or migrate foreign data.
    const reopenedOriginal = await openVault({
      name: 'foreign-codec-origin', indexedDB, codecs: modernCodecs,
    });
    const current = await reopenedOriginal.unlock(passphrase);
    try {
      expect((await current.storage.read(tx =>
        tx.records.get(foreignTenant, futureCodec.type, foreignId)))?.data).toEqual(foreign);
    } finally {
      await current.lock();
    }
  }, 30000);
});
