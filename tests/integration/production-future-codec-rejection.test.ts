import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { z } from '../../packages/kernel/src/index.ts';
import { archiveRecordRepo, RESTORE_WINDOW_MS } from '../../packages/bazaar/src/index.ts';
import { openVault, type BackupCodec, type UnlockedVault } from '../../packages/vault/src/index.ts';
import { archiveBackupCodec } from '../../apps/pwa/src/archive-backup.ts';
import { productionBackupCodecs } from '../../apps/pwa/src/backup-codecs.ts';

const passphrase = 'newer codec compatibility acceptance passphrase';
const archiveId = '0195aaaa-0000-7000-8000-000000000001';
const futureId = 'future-record-one';
const message = new TextEncoder().encode('future codec encrypted recovery identity');
const futureSchema = z.strictObject({ ownerId: z.string(), body: z.string() });
const futureCodec: BackupCodec = {
  type: 'test.future_record',
  parse: input => futureSchema.parse(input),
  indexes(input) {
    const record = futureSchema.parse(input);
    return [record.ownerId, null, null, null];
  },
};

type PersistedRows = Record<string, Array<readonly [IDBValidKey, unknown]>>;

function readRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB observation failed'));
  });
}

async function persistedRows(factory: IDBFactory, name: string): Promise<PersistedRows> {
  // A raw observer must not claim the writer fence or create a misspelled database.
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open('classrup-vault:' + name);
    let unexpectedUpgrade = false;
    request.onupgradeneeded = () => {
      unexpectedUpgrade = true;
      const opened = request.result;
      request.transaction?.abort();
      opened.close();
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(unexpectedUpgrade
      ? new Error('Expected an existing vault database for observation')
      : request.error ?? new Error('IndexedDB observation open failed'));
  });
  try {
    const tables = Array.from(db.objectStoreNames);
    const tx = db.transaction(tables, 'readonly');
    const completed = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB observation failed'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB observation aborted'));
    });
    const reading = Promise.all(tables.map(async table => {
      const store = tx.objectStore(table);
      const [keys, values] = await Promise.all([
        readRequest(store.getAllKeys()), readRequest(store.getAll()),
      ]);
      if (keys.length !== values.length) throw new Error('Inconsistent IndexedDB observation');
      return [table, keys.map((key, index) => [key, values[index]] as const)] as const;
    }));
    const [entries] = await Promise.all([reading, completed]);
    return Object.fromEntries(entries);
  } finally { db.close(); }
}

function withoutWriterFence(rows: PersistedRows): PersistedRows {
  // Reopening legitimately replaces only this operational token, not stored payload.
  return Object.fromEntries(Object.entries(rows).map(([table, entries]) => [
    table, table === 'meta' ? entries.filter(([key]) => key !== 'writer') : entries,
  ]));
}

describe('production backup compatibility with unknown future record types', () => {
  it('rejects a valid mixed future/current v1 backup without installing its supported records', async () => {
    const indexedDB = new IDBFactory();
    const futureRegistry = [...productionBackupCodecs, futureCodec];
    expect(productionBackupCodecs.some(codec => codec.type === futureCodec.type)).toBe(false);

    // A hypothetical newer application saves both an ordinary supported archive
    // and a new record type using the real signed/encrypted v1 exporter.
    const source = await openVault({
      name: 'future-codec-source', indexedDB, codecs: futureRegistry,
    });
    const original = await source.create(passphrase);
    const principal = original.principal;
    const archivedAt = new Date().toISOString();
    const restoreUntil = new Date(Date.parse(archivedAt) + RESTORE_WINDOW_MS).toISOString();
    const archive = {
      listingId: archiveId, ownerId: principal, status: 'archived' as const,
      endedAt: archivedAt, archivedAt, restoreUntil, purgeAt: restoreUntil,
    };
    const future = { ownerId: principal, body: 'Preserve this unknown future record' };
    const exported = await (async () => {
      try {
        const savedFuture = await original.storage.transaction(tx => tx.records.put({
          tenant: principal, type: futureCodec.type, id: futureId, data: future,
          idx: futureCodec.indexes(future), expectedRevision: 0, now: Date.now(),
        }));
        expect(savedFuture.ok).toBe(true);
        const savedArchive = await original.storage.transaction(tx => tx.records.put({
          tenant: principal, type: archiveRecordRepo.type, id: archiveId, data: archive,
          idx: archiveBackupCodec.indexes(archive), expectedRevision: 0, now: Date.now(),
        }));
        expect(savedArchive.ok).toBe(true);
        const coverage = await original.backupCoverage();
        expect(coverage.unsupportedRecordTypes).toEqual([]);
        expect(coverage.recordTypes).toEqual([
          { type: archiveRecordRepo.type, count: 1 },
          { type: futureCodec.type, count: 1 },
        ]);
        if (!savedArchive.ok || !savedFuture.ok) throw new Error('Mixed backup fixture records were not saved');
        return {
          backup: await original.exportBackup(passphrase),
          signature: await original.identity.sign(message),
          records: [savedArchive.value, savedFuture.value],
        };
      } finally {
        await original.lock();
      }
    })();

    // Positive control: the same encrypted backup must genuinely restore and
    // reopen in a newer application that understands both record types.
    const compatible = await openVault({
      name: 'future-codec-compatible', indexedDB, codecs: futureRegistry,
    });
    const compatibleSession = await compatible.restoreBackup(exported.backup, passphrase);
    expect(compatibleSession.principal).toBe(principal);
    expect(await compatibleSession.identity.sign(message)).toEqual(exported.signature);
    await compatibleSession.lock();

    const compatibleReopen = await openVault({
      name: 'future-codec-compatible', indexedDB, codecs: futureRegistry,
    });
    const reopenedSession = await compatibleReopen.unlock(passphrase);
    try {
      const archives = await reopenedSession.storage.read(tx => tx.records.query({
        tenant: principal, type: archiveRecordRepo.type,
        filters: [
          { slot: 1, op: 'eq', value: principal },
          { slot: 2, op: 'eq', value: archiveId },
          { slot: 3, op: 'eq', value: 'archived' },
          { slot: 4, op: 'eq', value: restoreUntil },
        ], orderSlot: 0, dir: 'asc', limit: 5,
      }));
      const futureRecords = await reopenedSession.storage.read(tx => tx.records.query({
        tenant: principal, type: futureCodec.type,
        filters: [{ slot: 1, op: 'eq', value: principal }],
        orderSlot: 0, dir: 'asc', limit: 5,
      }));
      expect(archives).toHaveLength(1);
      expect(archives[0]?.data).toEqual(archive);
      expect(futureRecords).toHaveLength(1);
      expect(futureRecords[0]?.id).toBe(futureId);
      expect(futureRecords[0]?.data).toEqual(future);
      expect(await reopenedSession.identity.sign(message)).toEqual(exported.signature);
    } finally {
      await reopenedSession.lock();
    }

    // The older production registry must reject the *same* valid backup at
    // signed manifest scope admission, before installing even the known archive.
    const destinationName = 'future-codec-destination';
    const destination = await openVault({
      name: destinationName, indexedDB, codecs: productionBackupCodecs,
    });
    const beforeRejection = await (async () => {
      try {
        const before = await persistedRows(indexedDB, destinationName);
        expect(before.records).toEqual([]);
        await expect(destination.restoreBackup(exported.backup, passphrase))
          .rejects.toThrow('Invalid or unsupported backup scope');
        expect(await destination.isInitialized()).toBe(false);
        expect(await persistedRows(indexedDB, destinationName)).toEqual(before);
        return before;
      } finally {
        await destination.close();
      }
    })();

    const reopened = await openVault({
      name: destinationName, indexedDB, codecs: productionBackupCodecs,
    });
    try {
      expect(await reopened.isInitialized()).toBe(false);
      expect(withoutWriterFence(await persistedRows(indexedDB, destinationName)))
        .toEqual(withoutWriterFence(beforeRejection));
    } finally {
      await reopened.close();
    }

    // The same rejected destination remains usable by a compatible receiver.
    // Compare complete stored records, including revision and timestamps, and
    // repeat the check after a real encrypted lock/reopen.
    const assertRecoveredState = async (session: UnlockedVault) => {
      expect(session.principal).toBe(principal);
      expect(await session.identity.sign(message)).toEqual(exported.signature);
      expect(await session.storage.read(tx => [
        tx.records.get(principal, archiveRecordRepo.type, archiveId),
        tx.records.get(principal, futureCodec.type, futureId),
      ])).toEqual(exported.records);
      const coverage = await session.backupCoverage();
      expect(coverage.recordTypes).toEqual([
        { type: archiveRecordRepo.type, count: 1 },
        { type: futureCodec.type, count: 1 },
      ]);
      expect(coverage.recordCount).toBe(2);
      expect(coverage.unsupportedRecordTypes).toEqual([]);
      expect(coverage.typeLimitExceeded).toBe(false);
      expect(coverage.recordLimitExceeded).toBe(false);
    };
    const retry = await openVault({
      name: destinationName, indexedDB, codecs: futureRegistry,
    });
    expect(await retry.isInitialized()).toBe(false);
    const retried = await retry.restoreBackup(exported.backup, passphrase);
    try {
      await assertRecoveredState(retried);
    } finally {
      await retried.lock();
    }
    // The same observer must see the real records installed by the compatible retry.
    expect((await persistedRows(indexedDB, destinationName)).records?.length).toBeGreaterThan(0);

    const retryReopen = await openVault({
      name: destinationName, indexedDB, codecs: futureRegistry,
    });
    const stable = await retryReopen.unlock(passphrase);
    try {
      await assertRecoveredState(stable);
    } finally {
      await stable.lock();
    }
  }, 30000);
});
