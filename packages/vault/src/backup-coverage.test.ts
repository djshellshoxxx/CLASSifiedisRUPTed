import { describe, expect, it } from 'vitest';
import { createMemoryStorage, defineRepo, z, ok } from '@classrup/kernel';
import { IDBFactory } from 'fake-indexeddb';
import { backupCodec, vaultFromStorage, openVault } from './vault.ts';

const passphrase = 'backup coverage test passphrase';
const note = defineRepo({ type: 'test.note', schema: z.strictObject({ text: z.string() }), indexes: {} });

describe('alpha backup coverage', () => {
  it('blocks unsupported records instead of silently omitting them from an otherwise valid backup', async () => {
    const vault = vaultFromStorage(createMemoryStorage(), [backupCodec(note)]);
    const session = await vault.create(passphrase);
    try {
      await session.storage.transaction(tx => tx.records.put({ tenant: session.principal, type: 'unregistered.private', id: 'one', data: { secret: 'must not disappear' }, idx: [null, null, null, null], expectedRevision: 0, now: 0 }));
      await expect(session.exportBackup(passphrase)).rejects.toThrow('unsupported record types');
    } finally { await session.lock(); }
  }, 30000);

  it('reports only current-principal counts and rechecks scope after a successful preview', async () => {
    const suppliedCodecs = [backupCodec(note)];
    const vault = vaultFromStorage(createMemoryStorage(), suppliedCodecs);
    // The accepted registry must survive caller mutation after opening the vault.
    Object.assign(suppliedCodecs[0]!, { type: 'changed.by.caller' });
    suppliedCodecs.length = 0;
    const session = await vault.create(passphrase);
    try {
      await session.storage.transaction(tx => {
        for (const [tenant, type, id] of [[session.principal, note.type, 'one'], [session.principal, note.type, 'two'], ['other-principal', 'foreign.secret', 'foreign']]) {
          const saved = tx.records.put({ tenant: tenant!, type: type!, id: id!, data: { text: 'private payload' }, idx: [null, null, null, null], expectedRevision: 0, now: 0 });
          if (!saved.ok) return saved;
        }
        return ok(undefined);
      });
      const preview = await session.backupCoverage();
      expect(preview).toMatchObject({ recordTypes: [{ type: note.type, count: 2 }], recordCount: 2, registeredRecordTypes: [note.type], unsupportedRecordTypes: [], typeLimitExceeded: false, recordLimitExceeded: false });
      expect(JSON.stringify(preview)).not.toMatch(/private payload|foreign.secret|vault.identity/);
      expect(preview.excludedStores).toContain('blobs');
      expect(preview.excludedStores).toContain('sync_outbox');
      const backup = await session.exportBackup(passphrase);
      expect(backup).toBeDefined();
      await session.storage.transaction(tx => tx.records.put({ tenant: session.principal, type: 'late.unsupported', id: 'late', data: {}, idx: [null, null, null, null], expectedRevision: 0, now: 0 }));
      expect((await session.backupCoverage()).unsupportedRecordTypes).toEqual(['late.unsupported']);
      await expect(session.exportBackup(passphrase)).rejects.toThrow('unsupported record types');
      expect(preview.unsupportedRecordTypes).toEqual([]);
    } finally { await session.lock(); }
    await expect(session.backupCoverage()).rejects.toThrow();
  }, 30000);

  it('reports type and record overflow without returning record payloads', async () => {
    const vault = vaultFromStorage(createMemoryStorage(), [backupCodec(note)]);
    const session = await vault.create(passphrase);
    try {
      await session.storage.transaction(tx => {
        for (let i = 0; i < 10001; i++) tx.records.put({ tenant: session.principal, type: note.type, id: String(i), data: { text: 'private' }, idx: [null, null, null, null], expectedRevision: 0, now: 0 });
        return ok(undefined);
      });
      expect(await session.backupCoverage()).toMatchObject({ recordCount: 10001, recordLimitExceeded: true, typeLimitExceeded: false });
      await expect(session.exportBackup(passphrase)).rejects.toThrow('Backup record limit exceeded');
      await session.storage.transaction(tx => {
        for (let i = 0; i < 257; i++) tx.records.put({ tenant: session.principal, type: `type.${String(i).padStart(3, '0')}`, id: 'one', data: {}, idx: [null, null, null, null], expectedRevision: 0, now: 0 });
        return ok(undefined);
      });
      const report = await session.backupCoverage();
      expect(report.typeLimitExceeded).toBe(true);
      expect(report.recordTypes).toHaveLength(256);
      await expect(session.exportBackup(passphrase)).rejects.toThrow('Backup record type limit exceeded');
    } finally { await session.lock(); }
  }, 30000);

  it('inventories encrypted IndexedDB after close/reopen and retains old backup compatibility', async () => {
    const indexedDB = new IDBFactory();
    const first = await openVault({ name: 'coverage-reopen', indexedDB, codecs: [backupCodec(note)] });
    const session = await first.create(passphrase);
    await session.storage.transaction(tx => tx.records.put({ tenant: session.principal, type: note.type, id: 'one', data: { text: 'private retained note' }, idx: [null, null, null, null], expectedRevision: 0, now: 0 }));
    const backup = await session.exportBackup(passphrase);
    await session.lock();
    const reopened = await openVault({ name: 'coverage-reopen', indexedDB, codecs: [backupCodec(note)] });
    const active = await reopened.unlock(passphrase);
    expect(await active.backupCoverage()).toMatchObject({ recordTypes: [{ type: note.type, count: 1 }], recordCount: 1 });
    await active.lock();
    const added = defineRepo({ type: 'new.feature', schema: z.strictObject({ enabled: z.boolean() }), indexes: {} });
    const compatible = vaultFromStorage(createMemoryStorage(), [backupCodec(note), backupCodec(added)]);
    const restored = await compatible.restoreBackup(backup, passphrase);
    expect(await restored.backupCoverage()).toMatchObject({ registeredRecordTypes: ['new.feature', note.type], recordCount: 1 });
    await restored.lock();
    const unsupported = vaultFromStorage(createMemoryStorage(), [backupCodec(added)]);
    await expect(unsupported.restoreBackup(backup, passphrase)).rejects.toThrow('Invalid or unsupported backup scope');
    expect(await unsupported.isInitialized()).toBe(false);
    await unsupported.close();
  }, 30000);
});
