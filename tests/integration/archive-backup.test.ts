import { describe, expect, it } from 'vitest';
import { createMemoryStorage } from '../../packages/kernel/src/index.ts';
import { vaultFromStorage } from '../../packages/vault/src/vault.ts';
import { archiveRecordRepo, RESTORE_WINDOW_MS } from '../../packages/bazaar/src/index.ts';
import { archiveBackupCodec } from '../../apps/pwa/src/archive-backup.ts';

const password = 'correct horse archive backup';
const archivedAt = '2026-11-16T10:00:00.000Z';
const restoreUntil = new Date(Date.parse(archivedAt) + RESTORE_WINDOW_MS).toISOString();
const id = '0195aaaa-0000-7000-8000-000000000001';
function row(ownerId: string) {
  return { listingId: id, ownerId, status: 'archived', endedAt: archivedAt, archivedAt, restoreUntil, purgeAt: restoreUntil };
}
describe('production archive backup codec', () => {
  it('round-trips archive dates and owner through encrypted backup with rebuilt indexes', async () => {
    const source = vaultFromStorage(createMemoryStorage(), [archiveBackupCodec]);
    const session = await source.create(password);
    const data = row(session.principal);
    await session.storage.transaction(tx => tx.records.put({ tenant: session.principal, type: archiveRecordRepo.type, id, data,
      idx: archiveBackupCodec.indexes(data), expectedRevision: 0, now: Date.parse(archivedAt) }));
    const backup = await session.exportBackup(password);
    expect(JSON.stringify(backup)).not.toContain(archivedAt);
    const destination = vaultFromStorage(createMemoryStorage(), [archiveBackupCodec]);
    const restored = await destination.restoreBackup(backup, password);
    const records = await restored.storage.read(tx => tx.records.query({ tenant: restored.principal, type: archiveRecordRepo.type, filters: [{ slot: 1, op: 'eq', value: restored.principal }, { slot: 2, op: 'eq', value: id }, { slot: 3, op: 'eq', value: 'archived' }, { slot: 4, op: 'eq', value: restoreUntil }], orderSlot: 0, dir: 'asc', limit: 10 }));
    expect(records).toHaveLength(1); expect(records[0]!.data).toEqual(data);
    await restored.lock(); await session.lock();
  });
  it('refuses foreign owner evidence before initializing a backup destination', async () => {
    const source = vaultFromStorage(createMemoryStorage(), [archiveBackupCodec]);
    const session = await source.create(password);
    const data = row('did:key:foreign-owner');
    await session.storage.transaction(tx => tx.records.put({ tenant: session.principal, type: archiveRecordRepo.type, id, data,
      idx: archiveBackupCodec.indexes(data), expectedRevision: 0, now: Date.parse(archivedAt) }));
    const backup = await session.exportBackup(password);
    const destination = vaultFromStorage(createMemoryStorage(), [archiveBackupCodec]);
    await expect(destination.restoreBackup(backup, password)).rejects.toThrow('Backup archive belongs to another principal');
    expect(await destination.isInitialized()).toBe(false);
    await destination.close(); await session.lock();
  });
  it('rejects extended restore deadlines and mismatched restored lifecycle dates', () => {
    expect(archiveRecordRepo.schema.safeParse({ ...row('did:key:owner'), restoreUntil: '2100-01-01T00:00:00.000Z' }).success).toBe(false);
    expect(archiveRecordRepo.schema.safeParse({ ...row('did:key:owner'), status: 'restored' }).success).toBe(false);
    expect(archiveRecordRepo.schema.safeParse({ ...row('did:key:owner'), status: 'restored', restoredAt: '2100-01-01T00:00:00.000Z' }).success).toBe(false);
  });
});
