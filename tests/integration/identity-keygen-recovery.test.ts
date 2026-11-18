import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createMemoryDriver } from '../../packages/kernel/src/storage/memory-driver.ts';
import { createStorage } from '../../packages/kernel/src/storage/storage.ts';
import { IdentityCryptoError, publicKeyFromDid } from '../../packages/identity/src/identity.ts';
import { openVault, vaultFromStorage } from '../../packages/vault/src/vault.ts';

const passphrase = 'a correctly scoped recovery test passphrase';
const operationError = () => new DOMException('native diagnostic canary', 'OperationError');

describe('bounded native generation at the vault boundary', () => {
  it('leaves no persisted identity after exhaustion and permits a later explicit create', async () => {
    const indexedDB = new IDBFactory();
    const name = 'keygen-exhaustion';
    const vault = await openVault({ name, indexedDB });
    const generate = vi.spyOn(crypto.subtle, 'generateKey').mockRejectedValue(operationError());
    try {
      await expect(vault.create(passphrase)).rejects.toBeInstanceOf(IdentityCryptoError);
      expect(generate).toHaveBeenCalledTimes(3);
      expect(await vault.isInitialized()).toBe(false);
      generate.mockRestore();

      const created = await vault.create(passphrase);
      const principal = created.principal;
      expect(await vault.isInitialized()).toBe(true);
      await created.lock();
      await expect(created.identity.sign(new Uint8Array([1]))).rejects.toThrow('locked');

      const reopened = await openVault({ name, indexedDB });
      try {
        expect(await reopened.isInitialized()).toBe(true);
        expect((await reopened.unlock(passphrase)).principal).toBe(principal);
      } finally { await reopened.close(); }
    } finally { generate.mockRestore(); await vault.close(); }
  });

  it('preserves concurrent-open and close guards while an eligible generation failure is pending', async () => {
    const indexedDB = new IDBFactory();
    const name = 'keygen-close-race';
    const vault = await openVault({ name, indexedDB });
    let enteredSignal: () => void = () => undefined;
    const entered = new Promise<void>(resolve => { enteredSignal = resolve; });
    let rejectGeneration: (reason: unknown) => void = () => undefined;
    const blockedGeneration = new Promise<CryptoKeyPair>((_resolve, reject) => { rejectGeneration = reject; });
    const generate = vi.spyOn(crypto.subtle, 'generateKey').mockImplementationOnce(() => {
      enteredSignal();
      return blockedGeneration;
    });
    let creating: Promise<unknown> | undefined;
    try {
      creating = vault.create(passphrase);
      await entered;
      await expect(vault.create(passphrase)).rejects.toThrow('Vault session already open');
      expect(generate).toHaveBeenCalledTimes(1);
      const rejected = expect(creating).rejects.toThrow('Vault closed');
      await vault.close();
      rejectGeneration(operationError());
      await rejected;
      expect(generate).toHaveBeenCalledTimes(2);

      const reopened = await openVault({ name, indexedDB });
      try { expect(await reopened.isInitialized()).toBe(false); }
      finally { await reopened.close(); }
    } finally {
      rejectGeneration(operationError());
      await creating?.catch(() => undefined);
      generate.mockRestore();
      await vault.close();
    }
  });

  it('preserves the recovered identity through signing, lock and encrypted backup restore without regeneration', async () => {
    const source = vaultFromStorage(createStorage(createMemoryDriver()));
    const target = vaultFromStorage(createStorage(createMemoryDriver()));
    const generate = vi.spyOn(crypto.subtle, 'generateKey').mockRejectedValueOnce(operationError());
    try {
      const created = await source.create(passphrase);
      expect(generate).toHaveBeenCalledTimes(2);
      const message = new TextEncoder().encode('independent recovered identity proof');
      const signature = await created.identity.sign(message);
      const publicKey = await crypto.subtle.importKey('raw', publicKeyFromDid(created.principal), 'Ed25519', false, ['verify']);
      expect(await crypto.subtle.verify('Ed25519', publicKey, signature.slice(), message)).toBe(true);

      const backup = await created.exportBackup(passphrase);
      expect(backup.format).toBe('classrup.sealed/v1');
      expect(JSON.stringify(backup)).not.toContain(created.principal);
      await created.lock();
      await expect(created.identity.sign(message)).rejects.toThrow('locked');

      const restored = await target.restoreBackup(backup, passphrase);
      expect(restored.principal).toBe(created.principal);
      expect(await restored.identity.sign(message)).toEqual(signature);
      expect(generate).toHaveBeenCalledTimes(2);
    } finally {
      generate.mockRestore();
      await source.close();
      await target.close();
    }
  });
});
