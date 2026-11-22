import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createMemoryStorage, defineRepo, type Storage, ok, z } from '../../packages/kernel/src/index.ts';
import { openIndexedDbStorage } from '../../packages/kernel/src/storage/indexeddb.ts';
import { openSqliteStorage } from '../../packages/kernel/src/storage/sqlite.ts';
import { blobRefOf } from '../../packages/kernel/src/storage/tx.ts';
import { backupCodec, vaultFromStorage } from '../../packages/vault/src/vault.ts';

const repo = defineRepo({
  type: 'test.backupsnapshot',
  schema: z.strictObject({ text: z.string() }),
  indexes: {},
});
const passphrase = 'atomic backup snapshot acceptance passphrase';
const now = Date.parse('2026-11-22T12:00:00.000Z');
const idx = [null, null, null, null] as const;

const factories: readonly { name: string; open(): Promise<Storage> }[] = [
  { name: 'memory', open: async () => createMemoryStorage() },
  { name: 'sqlite', open: async () => openSqliteStorage({ path: ':memory:' }) },
  { name: 'indexeddb', open: () => openIndexedDbStorage({
    name: 'atomic-backup-snapshot', indexedDB: new IDBFactory(),
  }) },
];

describe('backup inspection uses one persisted storage snapshot', () => {
  for (const factory of factories) {
    it(`${factory.name}: preserves coherent counts when a writer commits after the snapshot read`, async () => {
      const raw = await factory.open();
      let principal = '';
      let injectAfterNextRead = false;
      let inspectionReads = 0;
      const missingRef = await blobRefOf(new Uint8Array([42, 17, 202]));
      const tracked: Storage = {
        kind: raw.kind,
        transaction: (fn, options) => raw.transaction(fn, options),
        async read(fn) {
          // The injected writer commits after the read transaction has finished
          // but before its result reaches the vault. A two-read implementation
          // would combine old record counts with new attachment counts.
          const result = await raw.read(fn);
          if (injectAfterNextRead) {
            inspectionReads++;
            injectAfterNextRead = false;
            const changed = await raw.transaction(tx => {
              const added = tx.records.put({
                tenant: principal, type: repo.type, id: 'later',
                data: { text: 'late private payload' }, idx,
                expectedRevision: 0, now,
              });
              if (!added.ok) return added;
              tx.blobs.attach(principal, missingRef, 'listing/private-late');
              return ok(undefined);
            });
            expect(changed.ok).toBe(true);
          } else if (inspectionReads > 0) {
            inspectionReads++;
          }
          return result;
        },
        ping: () => raw.ping(),
        close: () => raw.close(),
      };
      const vault = vaultFromStorage(tracked, [backupCodec(repo)]);
      const session = await vault.create(passphrase);
      principal = session.principal;
      try {
        const original = await session.storage.transaction(tx => tx.records.put({
          tenant: principal, type: repo.type, id: 'initial',
          data: { text: 'earlier private payload' }, idx,
          expectedRevision: 0, now,
        }));
        expect(original.ok).toBe(true);
        injectAfterNextRead = true;
        const preview = await session.backupInspection!();
        expect(inspectionReads).toBe(1);
        expect(preview.records).toMatchObject({
          recordCount: 1, recordTypes: [{ type: repo.type, count: 1 }],
          unsupportedRecordTypes: [], typeLimitExceeded: false,
        });
        expect(preview.attachments).toMatchObject({
          referencedBlobs: 0, missingBlobs: 0,
          excludedStoredReferences: 0, holderRows: 0,
          limitExceeded: false, includedInV1Backup: false,
        });
        expect(JSON.stringify(preview)).not.toMatch(/earlier private payload|late private payload|listing\/private-late|blob:sha256-/);
        // A later inspection sees the completed write: the first result is not
        // retroactively modified and does not mix transaction snapshots.
        const latest = await session.backupInspection!();
        expect(latest.records.recordCount).toBe(2);
        expect(latest.attachments).toMatchObject({
          referencedBlobs: 1, missingBlobs: 1,
          excludedStoredReferences: 0, holderRows: 1,
        });
        expect(preview.records.recordCount).toBe(1);
        expect(preview.attachments?.holderRows).toBe(0);
      } finally {
        await session.lock();
      }
      await expect(session.backupInspection!()).rejects.toThrow(/Vault locked|Vault closed/);
    }, 30_000);
  }
});
