import { describe, expect, it } from 'vitest';
import { createMemoryStorage, defineRepo, z, ok } from '@classrup/kernel';
import { vaultFromStorage, backupCodec, openVault } from './vault.ts';
import { IDBFactory } from 'fake-indexeddb';
import { VaultUnlockRateLimitError } from './session-policy.ts';

const passphrase = 'a sufficiently long test passphrase';
const note = defineRepo({ type: 'test.note', schema: z.strictObject({ text: z.string() }), indexes: { text: d => d.text } });
const codecs = [backupCodec(note)];

describe('vault composition', () => {
  it('retains failed-unlock backoff when the application closes and reopens the same vault', async () => {
    const indexedDB = new IDBFactory();
    const original = await openVault({ name: 'unlock-backoff', indexedDB });
    const session = await original.create(passphrase);
    await session.lock();
    for (let attempt = 0; attempt < 3; attempt++) {
      const vault = await openVault({ name: 'unlock-backoff', indexedDB });
      await expect(vault.unlock('short')).rejects.toThrow('12–1024');
      await vault.close();
    }
    const blocked = await openVault({ name: 'unlock-backoff', indexedDB });
    await expect(blocked.unlock(passphrase)).rejects.toThrow(VaultUnlockRateLimitError);
    expect(await blocked.isInitialized()).toBe(true);
    await blocked.close();
  }, 30000);
  it('survives IndexedDB close/reopen, gates locked storage, and atomically restores signed encrypted records', async () => {
    const indexedDB = new IDBFactory();
    const first = await openVault({ name: 'test-vault', indexedDB, codecs });
    expect(await first.isInitialized()).toBe(false);
    const session = await first.create(passphrase);
    const principal = session.principal;
    const result = await session.storage.transaction(tx => tx.records.put({ tenant: principal, type: note.type, id: 'one', data: { text: 'private note' }, idx: ['private note', null, null, null], expectedRevision: 0, now: Date.now() }));
    expect(result.ok).toBe(true);
    const backup = await session.exportBackup(passphrase);
    expect(JSON.stringify(backup)).not.toContain('private note');
    await session.lock();
    await expect(session.storage.read(() => undefined)).rejects.toThrow();
    await expect(session.identity.sign(new Uint8Array())).rejects.toThrow();
    const reopened = await openVault({ name: 'test-vault', indexedDB, codecs });
    const unlocked = await reopened.unlock(passphrase);
    expect(unlocked.principal).toBe(principal);
    expect(await unlocked.storage.read(tx => tx.records.get(principal, note.type, 'one')?.data)).toEqual({ text: 'private note' });
    await unlocked.lock();
    const destination = vaultFromStorage(createMemoryStorage(), codecs);
    const restored = await destination.restoreBackup(backup, passphrase);
    expect(restored.principal).toBe(principal);
    expect(await restored.storage.read(tx => tx.records.get(principal, note.type, 'one')?.revision)).toBe(1);
    await expect(destination.restoreBackup(backup, passphrase)).rejects.toThrow();
    await restored.lock();
  }, 30000);
  it('restores older backups after registering additional codecs but rejects unsupported types', async () => {
    const source = vaultFromStorage(createMemoryStorage(), codecs);
    const session = await source.create(passphrase);
    await session.storage.transaction(tx => tx.records.put({ tenant: session.principal, type: note.type, id: 'old', data: { text: 'preserved' }, idx: ['preserved', null, null, null], expectedRevision: 0, now: Date.now() }));
    const backup = await session.exportBackup(passphrase);
    const added = defineRepo({ type: 'test.added', schema: z.strictObject({ value: z.string() }), indexes: {} });
    const destination = vaultFromStorage(createMemoryStorage(), [...codecs, backupCodec(added)]);
    const restored = await destination.restoreBackup(backup, passphrase);
    expect(await restored.storage.read(tx => tx.records.get(restored.principal, note.type, 'old')?.data)).toEqual({ text: 'preserved' });
    const unsupported = vaultFromStorage(createMemoryStorage(), [backupCodec(added)]);
    await expect(unsupported.restoreBackup(backup, passphrase)).rejects.toThrow('Invalid or unsupported backup scope');
    expect(await unsupported.isInitialized()).toBe(false);
    await restored.lock();
    await session.lock();
  }, 30000);
  it('rejects corrupt restores before creating an identity and rolls back a lock during an awaited write', async () => {
    const vault = vaultFromStorage(createMemoryStorage());
    await expect(vault.restoreBackup({ format: 'invalid' }, passphrase)).rejects.toThrow();
    expect(await vault.isInitialized()).toBe(false);
    const session = await vault.create(passphrase);
    let release: (() => void) | undefined;
    let entered: (() => void) | undefined;
    const ready = new Promise<void>(resolve => { entered = resolve; });
    const held = new Promise<void>(resolve => { release = resolve; });
    const write = session.storage.transaction(async tx => {
      tx.records.put({ tenant: session.principal, type: note.type, id: 'late', data: { text: 'not committed' }, idx: [null,null,null,null], expectedRevision: 0, now: Date.now() });
      entered?.();
      await held;
      return ok(undefined);
    });
    await ready;
    const lock = session.lock();
    release?.();
    await expect(write).rejects.toThrow();
    await lock;
  });
  it('rejects noncanonical record keys during backup restore without initializing the destination', async () => {
    const source = vaultFromStorage(createMemoryStorage(), codecs);
    const session = await source.create(passphrase);
    await session.storage.transaction(tx => tx.records.put({ tenant: session.principal, type: note.type, id: 'wrong-id', data: { text: 'canonical-id' }, idx: ['canonical-id', null, null, null], expectedRevision: 0, now: Date.now() }));
    const backup = await session.exportBackup(passphrase);
    const canonical = { ...backupCodec(note), recordId: (input: unknown) => note.schema.parse(input).text };
    const destination = vaultFromStorage(createMemoryStorage(), [canonical]);
    await expect(destination.restoreBackup(backup, passphrase)).rejects.toThrow('Backup record key mismatch');
    expect(await destination.isInitialized()).toBe(false);
    await destination.close();
    await session.lock();
  }, 30000);

  it('rechecks canonical keys after restore normalization before any records commit', async () => {
    const source = vaultFromStorage(createMemoryStorage(), codecs);
    const session = await source.create(passphrase);
    await session.storage.transaction(tx => tx.records.put({ tenant: session.principal, type: note.type, id: 'canonical', data: { text: 'canonical' }, idx: ['canonical', null, null, null], expectedRevision: 0, now: Date.now() }));
    const backup = await session.exportBackup(passphrase);
    const destination = vaultFromStorage(createMemoryStorage(), [{ ...backupCodec(note), recordId: (input: unknown) => note.schema.parse(input).text, restoreData: async () => ({ text: 'different' }) }]);
    await expect(destination.restoreBackup(backup, passphrase)).rejects.toThrow('Backup record key mismatch');
    expect(await destination.isInitialized()).toBe(false);
    await destination.close(); await session.lock();
  }, 30000);

});
