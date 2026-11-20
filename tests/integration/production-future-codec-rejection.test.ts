import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { z } from '../../packages/kernel/src/index.ts';
import { openVault, type BackupCodec } from '../../packages/vault/src/index.ts';
import { productionBackupCodecs } from '../../apps/pwa/src/backup-codecs.ts';

const passphrase = 'newer codec compatibility acceptance passphrase';
const futureSchema = z.strictObject({ ownerId: z.string(), body: z.string() });
const futureCodec: BackupCodec = {
  type: 'test.future_record',
  parse: input => futureSchema.parse(input),
  indexes(input) {
    const record = futureSchema.parse(input);
    return [record.ownerId, null, null, null];
  },
};

describe('production backup compatibility with unknown future record types', () => {
  it('rejects a newer signed, encrypted backup without partially initializing an older vault', async () => {
    const indexedDB = new IDBFactory();
    expect(productionBackupCodecs.some(codec => codec.type === futureCodec.type)).toBe(false);

    // A hypothetical newer application can register and export a valid extra domain record.
    const source = await openVault({
      name: 'future-codec-source', indexedDB,
      codecs: [...productionBackupCodecs, futureCodec],
    });
    const original = await source.create(passphrase);
    const backup = await (async () => {
      try {
        const data = { ownerId: original.principal, body: 'Preserve this unknown future record' };
        const inserted = await original.storage.transaction(tx => tx.records.put({
          tenant: original.principal, type: futureCodec.type, id: 'future-record-one', data,
          idx: futureCodec.indexes(data), expectedRevision: 0, now: Date.now(),
        }));
        expect(inserted.ok).toBe(true);
        const coverage = await original.backupCoverage();
        expect(coverage.unsupportedRecordTypes).toEqual([]);
        expect(coverage.recordTypes).toEqual([{ type: futureCodec.type, count: 1 }]);
        return await original.exportBackup(passphrase);
      } finally {
        await original.lock();
      }
    })();

    // The older PWA cannot silently omit the new type or install the sender's identity.
    const destination = await openVault({
      name: 'future-codec-destination', indexedDB, codecs: productionBackupCodecs,
    });
    try {
      await expect(destination.restoreBackup(backup, passphrase))
        .rejects.toThrow('Invalid or unsupported backup scope');
      expect(await destination.isInitialized()).toBe(false);
    } finally {
      await destination.close();
    }

    // The rejection must remain durable across a fresh encrypted IndexedDB connection.
    const reopened = await openVault({
      name: 'future-codec-destination', indexedDB, codecs: productionBackupCodecs,
    });
    try {
      expect(await reopened.isInitialized()).toBe(false);
    } finally {
      await reopened.close();
    }
  }, 30000);
});
