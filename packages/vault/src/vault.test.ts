import { describe, expect, it } from 'vitest';
import { createMemoryStorage, defineRepo, z, ok } from '@classrup/kernel';
import { vaultFromStorage, backupCodec, openVault } from './vault.ts';
import { IDBFactory } from 'fake-indexeddb';

const passphrase = 'a sufficiently long test passphrase';
const note = defineRepo({ type: 'test.note', schema: z.strictObject({ text: z.string() }), indexes: { text: d => d.text } });
const codecs = [backupCodec(note)];

describe('vault composition', () => {
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
});
