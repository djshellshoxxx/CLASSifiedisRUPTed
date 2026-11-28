import { IDBFactory, forceCloseDatabase } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { openVault, vaultFromStorage } from './vault.ts';
import { createStorage } from '@classrup/kernel';
import { createMemoryDriver } from '@classrup/kernel/browser';
import { VAULT_DB_VERSION } from '@classrup/kernel/browser';

const passphrase = 'synthetic native invalidation passphrase';
function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => { resolve = accept; });
  return { promise, resolve };
}
function observe(factory: IDBFactory, opened: (db: IDBDatabase) => void): IDBFactory {
  return new Proxy(factory, { get(target, property) {
    if (property === 'open') return (name: string, version?: number) => {
      const request = target.open(name, version);
      request.addEventListener('success', () => opened(request.result));
      return request;
    };
    const value: unknown = Reflect.get(target, property, target);
    return typeof value === 'function' ? value.bind(target) : value;
  } });
}
function upgradeAndAbort(factory: IDBFactory, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = factory.open(`classrup-vault:${name}`, VAULT_DB_VERSION + 1);
    request.onupgradeneeded = () => request.transaction!.abort();
    request.onerror = event => {
      event.preventDefault();
      if (request.error?.name === 'AbortError') resolve(); else reject(request.error);
    };
    request.onsuccess = () => { request.result.close(); reject(new Error('Fixture upgrade unexpectedly committed')); };
  });
}

describe('vault native invalidation', () => {
  it('does not publish a session read invalidated after the underlying storage result settles', async () => {
    const invalidation = new AbortController();
    const raw = createStorage(createMemoryDriver(), { invalidation: invalidation.signal });
    const vault = vaultFromStorage(raw);
    const session = await vault.create(passphrase);
    const read = raw.read.bind(raw);
    // This observer sees the underlying settlement before the session wrapper
    // can publish it. The original storage promise and callback stay unchanged.
    vi.spyOn(raw, 'read').mockImplementation(fn => {
      const result = read(fn);
      void result.then(() => invalidation.abort('versionchange'), () => undefined);
      return result;
    });
    try {
      await expect(session.storage.read(() => 'captured private result')).rejects.toThrow('Vault closed');
    } finally { await vault.close(); }
  });

  it.each(['versionchange', 'connection_closed'] as const)('revokes identity, delayed signatures and cached reads after %s; explicit reopen preserves identity and data', async reason => {
    const factory = new IDBFactory(), opened = deferred<IDBDatabase>();
    const name = `vault-invalidation-${reason}`;
    const vault = await openVault({ name, indexedDB: observe(factory, db => opened.resolve(db)) });
    const session = await vault.create(passphrase);
    const message = new TextEncoder().encode('synthetic identity continuity');
    const originalSignature = await session.identity.sign(message);
    const saved = await session.storage.transaction(tx => tx.records.put({ tenant: session.principal,
      type: 'test.note', id: 'preserved', data: { text: 'synthetic private record' },
      idx: ['synthetic index', null, null, null], expectedRevision: 0, now: 1_800_000_000_000 }));
    expect(saved.ok).toBe(true);
    const readEntered = deferred(), readResume = deferred(), signEntered = deferred(), signResume = deferred();
    const nativeSign = crypto.subtle.sign.bind(crypto.subtle);
    const spy = vi.spyOn(crypto.subtle, 'sign').mockImplementationOnce(async (...args) => {
      const signature = await nativeSign(...args);
      signEntered.resolve();
      await signResume.promise;
      return signature;
    });
    const signing = session.identity.sign(message);
    const read = session.storage.read(async tx => {
      const captured = tx.records.get(session.principal, 'test.note', 'preserved');
      readEntered.resolve();
      await readResume.promise;
      return captured;
    });
    const queuedCallback = vi.fn(() => 'stale queued result');
    const outcomes = Promise.allSettled([signing, read, session.storage.read(queuedCallback)]);
    try {
      await Promise.all([readEntered.promise, signEntered.promise]);
      const signal = session.storage.invalidation;
      expect(signal).toBeDefined();
      const invalidated = new Promise<void>(resolve => signal!.addEventListener('abort', () => resolve(), { once: true }));
      const cause = reason === 'versionchange' ? upgradeAndAbort(factory, name)
        : Promise.resolve(forceCloseDatabase((await opened.promise) as unknown as Parameters<typeof forceCloseDatabase>[0]));
      await invalidated;
      expect(signal!.reason).toBe(reason);
      await expect(session.identity.sign(message)).rejects.toThrow('Identity locked');
      await expect(session.storage.read(() => 'new stale result')).rejects.toThrow('Vault closed');
      expect(await session.storage.ping()).toBe(false);
      const closing = vault.close();
      expect(vault.close()).toBe(closing);
      signResume.resolve(); readResume.resolve();
      const results = await outcomes;
      expect(results[0]).toEqual({ status: 'rejected', reason: new Error('Identity locked') });
      for (const result of results.slice(1)) {
        expect(result.status).toBe('rejected');
        if (result.status === 'rejected') expect(result.reason.message).toMatch(/closed|invalidated/);
      }
      expect(queuedCallback).not.toHaveBeenCalled();
      await Promise.all([closing, cause]);
      const reopened = await openVault({ name, indexedDB: factory });
      try {
        const fresh = await reopened.unlock(passphrase);
        expect(fresh.principal).toBe(session.principal);
        expect(await fresh.identity.sign(message)).toEqual(originalSignature);
        expect(await fresh.storage.read(tx => tx.records.query({ tenant: fresh.principal, type: 'test.note',
          filters: [{ slot: 1, op: 'eq', value: 'synthetic index' }], orderSlot: 0, dir: 'asc', limit: 5 })))
          .toEqual(saved.ok ? [saved.value] : []);
      } finally { await reopened.close(); }
    } finally {
      signResume.resolve(); readResume.resolve(); spy.mockRestore();
      await outcomes;
      await vault.close();
    }
  }, 30000);
});
