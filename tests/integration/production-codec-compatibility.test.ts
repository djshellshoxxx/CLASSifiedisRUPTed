import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { ok } from '../../packages/kernel/src/index.ts';
import { archiveRecordRepo, RESTORE_WINDOW_MS } from '../../packages/bazaar/src/index.ts';
import { locationBackupCodecs, locationSettingRepo } from '../../packages/discovery/src/index.ts';
import { backupCodec, openVault } from '../../packages/vault/src/index.ts';
import { archiveBackupCodec } from '../../apps/pwa/src/archive-backup.ts';
import { productionBackupCodecs } from '../../apps/pwa/src/backup-codecs.ts';

const passphrase = 'legacy mixed production compatibility passphrase';
const firstId = '0195aaaa-0000-7000-8000-000000000001';
const secondId = '0195aaaa-0000-7000-8000-000000000002';

function archived(ownerId: string, listingId = firstId) {
  const archivedAt = '2026-11-16T10:00:00.000Z';
  const restoreUntil = new Date(Date.parse(archivedAt) + RESTORE_WINDOW_MS).toISOString();
  return { listingId, ownerId, status: 'archived' as const, endedAt: archivedAt, archivedAt, restoreUntil, purgeAt: restoreUntil };
}

describe('production codec backward compatibility and fail-closed recovery', () => {
  it('accepts a valid legacy archive-only v1 backup under the expanded production codec registry', async () => {
    const indexedDB = new IDBFactory();
    const source = await openVault({ name: 'legacy-archive-source', indexedDB, codecs: [archiveBackupCodec] });
    const original = await source.create(passphrase);
    const data = archived(original.principal);
    const signedMessage = new TextEncoder().encode('legacy archive identity');
    const originalSignature = await original.identity.sign(signedMessage);
    const saved = await original.storage.transaction(tx => tx.records.put({
      tenant: original.principal, type: archiveRecordRepo.type, id: firstId, data,
      idx: archiveBackupCodec.indexes(data), expectedRevision: 0, now: Date.parse(data.archivedAt),
    }));
    expect(saved.ok).toBe(true);
    const originalRecord = await original.storage.read(tx => tx.records.get(original.principal, archiveRecordRepo.type, firstId));
    const sealed = await original.exportBackup(passphrase);
    const originalPrincipal = original.principal;
    await original.lock();

    // An old subset's declared types are permitted even when the current PWA knows more types.
    const destination = await openVault({ name: 'legacy-archive-destination', indexedDB, codecs: productionBackupCodecs });
    const restored = await destination.restoreBackup(sealed, passphrase);
    expect(restored.principal).toBe(originalPrincipal);
    expect(await restored.identity.sign(signedMessage)).toEqual(originalSignature);
    await restored.lock();

    const reopened = await openVault({ name: 'legacy-archive-destination', indexedDB, codecs: productionBackupCodecs });
    const session = await reopened.unlock(passphrase);
    try {
      const records = await session.storage.read(tx => tx.records.query({
        tenant: session.principal, type: archiveRecordRepo.type,
        filters: [{ slot: 1, op: 'eq', value: session.principal },
          { slot: 2, op: 'eq', value: firstId }, { slot: 3, op: 'eq', value: 'archived' },
          { slot: 4, op: 'eq', value: data.restoreUntil }],
        orderSlot: 0, dir: 'asc', limit: 5,
      }));
      expect(records).toEqual([originalRecord]);
      expect((await session.backupCoverage()).recordTypes.map(row => row.type)).toEqual([archiveRecordRepo.type]);
      expect(await session.identity.sign(signedMessage)).toEqual(originalSignature);
    } finally { await session.lock(); }
  }, 30000);

  it('rejects foreign archive ownership in a legacy mixed-type backup without initializing the new vault', async () => {
    const indexedDB = new IDBFactory();
    const locationCodecs = locationBackupCodecs(backupCodec);
    const locationCodec = locationCodecs.find(codec => codec.type === locationSettingRepo.type);
    if (!locationCodec) throw new Error('Missing location backup codec');
    // Model an older archive-only schema admission path, not the modern owner guard.
    const source = await openVault({ name: 'legacy-mixed-foreign-source', indexedDB,
      codecs: [backupCodec(archiveRecordRepo), ...locationCodecs] });
    const original = await source.create(passphrase);
    let sealed: Awaited<ReturnType<typeof original.exportBackup>>;
    try {
      const foreignArchive = archived('did:key:foreign-owner', secondId);
      const at = new Date().toISOString();
      const location = { settingId: firstId, ownerDid: original.principal, homeCell5: 'u4pru',
        publicLevel: 'L1' as const, entryMode: 'map_tile' as const,
        changeCount24h: 1, changeTimes: [at], lastChangedAt: at };
      const saved = await original.storage.transaction(tx => {
        const archiveResult = tx.records.put({
          tenant: original.principal, type: archiveRecordRepo.type, id: secondId,
          data: foreignArchive, idx: archiveBackupCodec.indexes(foreignArchive),
          expectedRevision: 0, now: Date.parse(foreignArchive.archivedAt),
        });
        if (!archiveResult.ok) return archiveResult;
        const locationResult = tx.records.put({
          tenant: original.principal, type: locationSettingRepo.type, id: original.principal,
          data: location, idx: locationCodec.indexes(location), expectedRevision: 0, now: Date.now(),
        });
        if (!locationResult.ok) return locationResult;
        return ok(undefined);
      });
      expect(saved.ok).toBe(true);
      expect((await original.backupCoverage()).recordTypes).toHaveLength(2);
      sealed = await original.exportBackup(passphrase);
    } finally { await original.lock(); }

    const destination = await openVault({ name: 'legacy-mixed-foreign-destination', indexedDB, codecs: productionBackupCodecs });
    await expect(destination.restoreBackup(sealed, passphrase)).rejects.toThrow('Backup archive belongs to another principal');
    expect(await destination.isInitialized()).toBe(false);
    await destination.close();

    const reopened = await openVault({ name: 'legacy-mixed-foreign-destination', indexedDB, codecs: productionBackupCodecs });
    expect(await reopened.isInitialized()).toBe(false);
    await reopened.close();
  }, 30000);
});
