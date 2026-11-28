import { IDBFactory, IDBDatabase as FakeDatabase } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { createFakeClock, ok, unwrap, type Clock, type Storage, type StoredRecord } from '@classrup/kernel';
import { openIndexedDbStorage } from '@classrup/kernel/browser';
import { createIdentity } from '@classrup/identity';
import { openEncryptedStorage } from './encrypted-storage.ts';
import { openVault, vaultFromStorage } from './vault.ts';

const passphrase = 'synthetic failed-unlock cleanup passphrase';
const instant = Date.parse('2026-11-27T12:00:00.000Z');
const message = new TextEncoder().encode('synthetic identity continuity check');
const root = (storage: Storage) => storage.read(tx => tx.records.get('local-vault', 'vault.identity', 'root'));
const secret = (storage: Storage, principal: string) => storage.read(tx => tx.records.get(principal, 'test.secret', 'kept'));
const put = (principal: string) => ({ tenant: principal, type: 'test.secret', id: 'kept',
  data: { text: 'private-maintenance-canary' }, idx: ['private-index-canary', null, null, null] as const,
  expectedRevision: 0, now: instant });

async function durableRows(indexedDB: IDBFactory, name: string): Promise<Record<string, unknown[]>> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(`classrup-vault:${name}`);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    const tx = db.transaction([...db.objectStoreNames], 'readonly');
    return Object.fromEntries(await Promise.all([...db.objectStoreNames].map(async table => {
      const rows = await new Promise<unknown[]>((resolve, reject) => {
        const request = tx.objectStore(table).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return [table, rows] as const;
    })));
  } finally { db.close(); }
}

async function seed(indexedDB: IDBFactory, name: string, retention = false) {
  const vault = await openVault({ name, indexedDB, clock: createFakeClock(instant) });
  try {
    const session = await vault.create(passphrase);
    const record = unwrap(await session.storage.transaction(tx => tx.records.put(put(session.principal))));
    if (retention) await session.storage.transaction(tx => {
      for (const [key, offset] of [['expired', -1], ['live', 86400000]] as const) {
        tx.idempotency.save({ tenant: session.principal, actor: 'owner', command: 'test.save', key,
          requestHash: key, status: 200, response: { value: key }, createdAt: new Date(instant - 1000).toISOString(),
          expiresAt: new Date(instant + offset).toISOString() });
      }
      return ok(undefined);
    });
    return { principal: session.principal, record, signature: await session.identity.sign(message) };
  } finally { await vault.close(); }
}

async function expectRecovered(storage: Storage, principal: string, record: StoredRecord) {
  expect(await secret(storage, principal)).toEqual(record);
  expect(await storage.read(tx => tx.records.query({ tenant: principal, type: 'test.secret',
    filters: [{ slot: 1, op: 'eq', value: 'private-index-canary' }], orderSlot: 1, dir: 'asc', limit: 5 }))).toEqual([record]);
}

describe('failed encrypted-storage unlock cleanup', () => {
  it('keeps only the sealed root after maintenance fails and safely retries the same handle', async () => {
    const indexedDB = new IDBFactory(), name = 'unlock-maintenance-failure';
    const saved = await seed(indexedDB, name);
    const failure = new Error('injected maintenance clock failure');
    let failing = true;
    const clock: Clock = { now: () => { if (failing) throw failure; return instant; }, iso: () => new Date(instant).toISOString() };
    const protectedStorage = await openEncryptedStorage({ name: `classrup-vault:${name}`, indexedDB, clock });
    const vault = vaultFromStorage(protectedStorage.storage, [], protectedStorage.unlock);
    try {
      const originalRoot = await root(protectedStorage.storage);
      expect(originalRoot).toBeDefined();
      expect(await secret(protectedStorage.storage, saved.principal)).toBeUndefined();
      await expect(vault.unlock(passphrase)).rejects.toBe(failure);
      expect(await root(protectedStorage.storage)).toEqual(originalRoot);
      expect(await secret(protectedStorage.storage, saved.principal)).toBeUndefined();
      expect(() => protectedStorage.storage.transaction(() => ok(undefined))).toThrow('Vault storage locked');
      failing = false;
      const session = await vault.unlock(passphrase);
      expect(session.principal).toBe(saved.principal);
      expect(await session.identity.sign(message)).toEqual(saved.signature);
      await expectRecovered(session.storage, saved.principal, saved.record);
    } finally { await vault.close(); }
  }, 30000);

  it('retains a committed legacy migration while refreshing the root before same-handle retry', async () => {
    const indexedDB = new IDBFactory(), name = 'legacy-maintenance-failure';
    const created = await createIdentity(passphrase), principal = created.identity.principal;
    const signature = await created.identity.sign(message);
    const legacy = await openIndexedDbStorage({ name: `classrup-vault:${name}`, indexedDB, clock: createFakeClock(instant) });
    let record: StoredRecord;
    try {
      unwrap(await legacy.transaction(tx => tx.records.put({ tenant: 'local-vault', type: 'vault.identity', id: 'root',
        data: created.protectedIdentity, idx: [null, null, null, null], expectedRevision: 0, now: instant })));
      record = unwrap(await legacy.transaction(tx => tx.records.put(put(principal))));
    } finally { created.identity.lock(); await legacy.close(); }
    const failure = new Error('maintenance failed after migration');
    let failing = true;
    const protectedStorage = await openEncryptedStorage({ name: `classrup-vault:${name}`, indexedDB,
      clock: { now: () => { if (failing) throw failure; return instant; }, iso: () => new Date(instant).toISOString() } });
    const vault = vaultFromStorage(protectedStorage.storage, [], protectedStorage.unlock);
    try {
      await expect(vault.unlock(passphrase)).rejects.toBe(failure);
      expect(await secret(protectedStorage.storage, principal)).toBeUndefined();
      expect((await root(protectedStorage.storage))?.data).toMatchObject({ format: 'classrup.vault-identity/v2' });
      const migrated = await durableRows(indexedDB, name);
      expect(JSON.stringify(migrated)).not.toContain('private-maintenance-canary');
      expect(JSON.stringify(migrated)).toContain('classrup.storage-row/v1');
      failing = false;
      const session = await vault.unlock(passphrase);
      expect(session.principal).toBe(principal);
      expect(await session.identity.sign(message)).toEqual(signature);
      await expectRecovered(session.storage, principal, record!);
      // A second unlock must use the committed root and header, not repeat migration.
      expect(await durableRows(indexedDB, name)).toEqual(migrated);
    } finally { await vault.close(); }
  }, 30000);

  it('rolls back a rejected retention commit and applies only ordinary expiry rules on retry', async () => {
    const indexedDB = new IDBFactory(), name = 'retention-commit-failure';
    const saved = await seed(indexedDB, name, true);
    const protectedStorage = await openEncryptedStorage({ name: `classrup-vault:${name}`, indexedDB, clock: createFakeClock(instant) });
    const vault = vaultFromStorage(protectedStorage.storage, [], protectedStorage.unlock);
    const before = await durableRows(indexedDB, name);
    const failure = new DOMException('injected retention commit failure', 'QuotaExceededError');
    const transaction = FakeDatabase.prototype.transaction;
    const rejectedCommit = vi.spyOn(FakeDatabase.prototype, 'transaction').mockImplementation(function (this: IDBDatabase, ...args: Parameters<typeof transaction>) {
      if (args[1] === 'readwrite') throw failure;
      return transaction.apply(this, args);
    });
    try {
      await expect(vault.unlock(passphrase)).rejects.toBe(failure);
    } finally { rejectedCommit.mockRestore(); }
    try {
      expect(await durableRows(indexedDB, name)).toEqual(before);
      expect(await secret(protectedStorage.storage, saved.principal)).toBeUndefined();
      const session = await vault.unlock(passphrase);
      await expectRecovered(session.storage, saved.principal, saved.record);
      const key = { tenant: saved.principal, actor: 'owner', command: 'test.save' };
      expect(await session.storage.read(tx => tx.idempotency.lookup({ ...key, key: 'expired' }, instant - 1000))).toBeUndefined();
      expect(await session.storage.read(tx => tx.idempotency.lookup({ ...key, key: 'live' }, instant))).toMatchObject({ response: { value: 'live' } });
      expect((await durableRows(indexedDB, name)).idempotency).toHaveLength(1);
    } finally { await vault.close(); }
  }, 30000);

  for (const finish of ['publish', 'close'] as const) {
    it(`keeps initialization private while maintenance is pending and honors ${finish}`, async () => {
      const indexedDB = new IDBFactory(), name = `held-maintenance-${finish}`;
      const saved = await seed(indexedDB, name, true);
      const protectedStorage = await openEncryptedStorage({ name: `classrup-vault:${name}`, indexedDB, clock: createFakeClock(instant) });
      const before = await durableRows(indexedDB, name);
      let release!: () => void, entered!: () => void;
      const held = new Promise<void>(resolve => { release = resolve; });
      const started = new Promise<void>(resolve => { entered = resolve; });
      const encrypt = crypto.subtle.encrypt;
      let pause = true;
      const heldEncryption = vi.spyOn(crypto.subtle, 'encrypt').mockImplementation(async (...args) => {
        const encrypted = await encrypt.apply(crypto.subtle, args);
        if (pause && new TextDecoder().decode((args[0] as AesGcmParams).additionalData) === JSON.stringify([
          'classrup.storage-row/v1', `classrup-vault:${name}`, 'meta', 'vault.inventory/v1',
        ])) {
          pause = false; entered(); await held;
        }
        return encrypted;
      });
      const pending = protectedStorage.unlock(passphrase, true);
      const outcome = pending.then(() => ({ ok: true as const }), error => ({ ok: false as const, error }));
      try {
        await started;
        let readSettled = false;
        const during = secret(protectedStorage.storage, saved.principal).then(value => { readSettled = true; return value; });
        await new Promise<void>(resolve => { setTimeout(resolve, 0); });
        // Root reads must not wait behind, or expose, the private maintenance candidate.
        expect(readSettled).toBe(true);
        expect(await during).toBeUndefined();
        expect(await protectedStorage.storage.ping()).toBe(false);
        expect(() => protectedStorage.storage.transaction(() => ok(undefined))).toThrow('Vault storage locked');
        await expect(protectedStorage.unlock(passphrase, true)).rejects.toThrow('Vault storage opening');
        if (finish === 'close') {
          const first = protectedStorage.storage.close(), second = protectedStorage.storage.close();
          expect(second).toBe(first);
          let closed = false;
          void first.then(() => { closed = true; });
          await new Promise<void>(resolve => { setTimeout(resolve, 0); });
          expect(closed).toBe(false);
          release();
          expect(await outcome).toMatchObject({ ok: false, error: expect.any(Error) });
          await Promise.all([first, second]);
          expect(() => protectedStorage.storage.read(() => 'late')).toThrow('Vault closed');
          expect(await durableRows(indexedDB, name)).toEqual(before);
        } else {
          release();
          expect(await outcome).toEqual({ ok: true });
          await expectRecovered(protectedStorage.storage, saved.principal, saved.record);
        }
      } finally {
        release(); await outcome; heldEncryption.mockRestore(); await protectedStorage.storage.close();
      }
      const reopened = await openVault({ name, indexedDB, clock: createFakeClock(instant) });
      try {
        const session = await reopened.unlock(passphrase);
        expect(session.principal).toBe(saved.principal);
        expect(await session.identity.sign(message)).toEqual(saved.signature);
        await expectRecovered(session.storage, saved.principal, saved.record);
      } finally { await reopened.close(); }
    }, 30000);
  }

  it('preserves the maintenance error and fails closed when root refresh also fails', async () => {
    const indexedDB = new IDBFactory(), name = 'unlock-cleanup-refresh-failure';
    const saved = await seed(indexedDB, name);
    const failure = new Error('original maintenance failure');
    let cleaning = false;
    const protectedStorage = await openEncryptedStorage({ name: `classrup-vault:${name}`, indexedDB,
      clock: { now: () => { cleaning = true; throw failure; }, iso: () => new Date(instant).toISOString() } });
    const transaction = FakeDatabase.prototype.transaction;
    const refreshFailure = vi.spyOn(FakeDatabase.prototype, 'transaction').mockImplementation(function (this: IDBDatabase, ...args: Parameters<typeof transaction>) {
      if (cleaning && args[1] === 'readonly') throw new Error('secondary root snapshot failure');
      return transaction.apply(this, args);
    });
    try {
      await expect(protectedStorage.unlock(passphrase, true)).rejects.toBe(failure);
      expect(() => protectedStorage.storage.read(() => 'late')).toThrow('Vault closed');
      await expect(protectedStorage.unlock(passphrase, true)).rejects.toThrow('Vault closed');
    } finally { refreshFailure.mockRestore(); await protectedStorage.storage.close(); }
    const reopened = await openVault({ name, indexedDB, clock: createFakeClock(instant) });
    try {
      const session = await reopened.unlock(passphrase);
      expect(session.principal).toBe(saved.principal);
      await expectRecovered(session.storage, saved.principal, saved.record);
    } finally { await reopened.close(); }
  }, 30000);
});
